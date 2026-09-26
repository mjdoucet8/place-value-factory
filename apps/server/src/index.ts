import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  AccessError,
  LocalIdentity,
  sessionCookie,
  sessionToken,
} from "./identity.js";
import { PostgresRuntimeStore } from "./runtime-store.js";
import { buildStudentReport, reportWindow } from "./reporting.js";
import {
  DENOMINATIONS,
  adaptedDifficulty,
  evidenceScore,
  generateLevelOrder,
  generatePracticeOrder,
  isIndependentFirst,
  nextPracticeSkill,
  schedulePracticeSkills,
  stageGate,
  summarizeMastery,
  validateRepresentation,
  witnessFor,
  orderSignature,
  scaffoldForSkill,
  type EvidenceRecord,
} from "../../../packages/game-engine/src/index.js";
import {
  LEVELS,
  STAGE_GATE_SKILLS,
  levelById,
} from "../../../packages/config/src/index.js";

const port = Number(process.env.PORT ?? 3101);
const defaultDataPath = process.env.PVF_DATA_PATH
  ? resolve(process.env.PVF_DATA_PATH)
  : resolve(process.cwd(), "db/local-development.json");
const leaseDurationMs = 60_000;
const stageCertificationIds = ["stage-1", "stage-2", "stage-3", "stage-4", "stage-5", "stage-6"];
const stageDisplayTiers = ["Packer", "Converter", "Specialist", "Supervisor", "Supervisor", "Factory Master"];

type Order = ReturnType<typeof generateLevelOrder>;
type ResponseRecord = {
  commandId?: string;
  activeMs?: number;
  order: Order;
  representationA: unknown;
  representationB: unknown;
  validation: ReturnType<typeof validateRepresentation>;
  at: string;
};
type Receipt = {
  actorId: string;
  commandId: string;
  payloadHash: string;
  status: number;
  body: unknown;
};
type HintStep = "H1" | "H2" | "H3";
type SupportEvent = { orderId: string; step: HintStep; at: string };
export type Attempt = {
  id: string;
  studentId: string;
  levelId: string;
  seed: number;
  slot: number;
  replacementIndex?: number;
  skippedOrders?: number;
  activeOrder?: Order;
  responses: ResponseRecord[];
  completed: boolean;
  createdAt: string;
  revision: number;
  leaseEpoch: number;
  writerTabId: string;
  leaseExpiresAt: string;
  receipts: Receipt[];
  evidence: (EvidenceRecord & { orderId?: string })[];
  supportEvents: SupportEvent[];
  transferOrder?: Order;
  transferStar?: boolean;
  status?: "active" | "paused" | "completed";
  kind?: "path" | "practice" | "replay";
  practiceSkill?: string;
  practiceSchedule?: string[];
  awardedTier?: string;
  issuedOrders?: { spec: Order; slot: number; replacement: number; role: "main" | "transfer"; status: "active" | "resolved" | "skipped" }[];
};
type Settings = {
  sound: boolean;
  reducedMotion: boolean;
  pressure: "calm" | "busy";
  textScale: "normal" | "large";
};
export type Store = {
  attempts: Attempt[];
  settings?: Record<string, Settings>;
  studentAccess?: Record<string, boolean>;
  certifications?: Record<string, string[]>;
  levelAccessOverrides?: { teacherId: string; studentId: string; levelId: string; enabled: boolean; reasonCode: string; commandId: string; at: string }[];
};
type Actor = { id: string; role: "student" | "teacher" };
type Command = {
  commandId: string;
  expectedRevision: number;
  leaseEpoch: number;
  tabId: string;
};
const developmentStudents = [
  {
    id: "student-ava",
    username: "ava",
    pin: "123456",
    alias: "Ava",
    classCode: "FACTORY5",
    classId: "class-demo",
  },
];
const developmentTeachers = [
  {
    id: "teacher-dev",
    username: "teacher",
    password: "factory-demo",
    classIds: ["class-demo"],
  },
  {
    id: "teacher-other",
    username: "other-teacher",
    password: "other-demo",
    classIds: ["class-other"],
  },
];
const developmentClasses = [
  { id: "class-demo", name: "Factory 5", timezone: "America/Toronto" },
  { id: "class-other", name: "Other Factory", timezone: "America/Toronto" },
];

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
function hashPayload(body: unknown) {
  return createHash("sha256").update(stableJson(body)).digest("hex");
}
function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
function commandFrom(body: unknown): Command | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  return typeof value.commandId === "string" &&
    value.commandId.length > 0 &&
    isNonNegativeInteger(value.expectedRevision) &&
    isNonNegativeInteger(value.leaseEpoch) &&
    typeof value.tabId === "string" &&
    value.tabId.length > 0
    ? (value as unknown as Command)
    : null;
}
function startCommandFrom(
  body: unknown,
): { commandId: string; profileRevision: number; tabId: string } | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  return typeof value.commandId === "string" &&
    value.commandId.length > 0 &&
    isNonNegativeInteger(value.profileRevision) &&
    typeof value.tabId === "string" &&
    value.tabId.length > 0
    ? (value as unknown as {
        commandId: string;
        profileRevision: number;
        tabId: string;
      })
    : null;
}

export function createApiServer(
  dataPath = defaultDataPath,
  options: {
    database?: Pool;
    identity?: { origin: string; receiptKey: string };
    /** Injectable authoritative clock for deterministic evidence and lease journeys. */
    now?: () => Date;
  } = {},
): Server {
  const now = options.now ?? (() => new Date());
  if (
    (process.env.NODE_ENV === "production" ||
      process.env.PVF_MODE === "pilot") &&
    !options.identity
  )
    throw new Error(
      "Secure identity configuration is required; the development identity adapter cannot run in pilot or production mode.",
    );
  const database = options.database;
  const sqlStore = database ? new PostgresRuntimeStore(database) : null;
  if (options.identity && !sqlStore)
    throw new Error("Secure identity requires PostgreSQL.");
  if (options.identity && !/^[a-f0-9]{64}$/i.test(options.identity.receiptKey))
    throw new Error(
      "Secure identity requires a 32-byte PIN receipt encryption key.",
    );
  const identity =
    options.identity && sqlStore
      ? new LocalIdentity(
          () => sqlStore.connection(),
          Buffer.from(options.identity.receiptKey, "hex"),
        )
      : null;
  const origin = options.identity ? new URL(options.identity.origin) : null;
  if (
    origin &&
    origin.protocol !== "https:" &&
    !(
      ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) &&
      origin.protocol === "http:"
    )
  )
    throw new Error("Secure identity requires HTTPS except on local loopback.");
  const directories = new AsyncLocalStorage<
    Awaited<ReturnType<LocalIdentity["directory"]>>
  >();
  const directory = () =>
    directories.getStore() ?? {
      students: developmentStudents,
      teachers: developmentTeachers,
      classes: developmentClasses,
    };
  type Reply = {
    status: number;
    body?: unknown;
    extraHeaders: Record<string, string>;
  };
  const pendingReplies = new WeakMap<ServerResponse, Reply | null>();
  async function store(): Promise<Store> {
    if (sqlStore) return sqlStore.load();
    try {
      const parsed = JSON.parse(await readFile(dataPath, "utf8")) as Store;
      return {
        attempts: parsed.attempts.map(hydrateAttempt),
        settings: parsed.settings ?? {},
        studentAccess: parsed.studentAccess ?? {},
        certifications: parsed.certifications ?? {},
        levelAccessOverrides: parsed.levelAccessOverrides ?? [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return { attempts: [], settings: {}, studentAccess: {}, certifications: {}, levelAccessOverrides: [] };
      throw error;
    }
  }
  async function save(value: Store) {
    if (sqlStore) return sqlStore.save(value);
    await mkdir(dirname(dataPath), { recursive: true });
    await writeFile(dataPath, JSON.stringify(value, null, 2));
  }
  function send(
    response: ServerResponse,
    status: number,
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ) {
    if (pendingReplies.has(response)) {
      pendingReplies.set(response, { status, body, extraHeaders });
      return;
    }
    response.writeHead(status, {
      "content-type": "application/json",
      ...(identity
        ? { "cache-control": "no-store", "x-content-type-options": "nosniff" }
        : {
            "access-control-allow-origin": "*",
            "access-control-allow-headers":
              "content-type,x-session,idempotency-key",
          }),
      ...extraHeaders,
    });
    response.end(body === undefined ? undefined : JSON.stringify(body));
  }
  async function json(
    request: IncomingMessage,
  ): Promise<Record<string, unknown>> {
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 32 * 1024) throw new Error("BODY_TOO_LARGE");
    }
    const parsed: unknown = body ? JSON.parse(body) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("INVALID_INPUT");
    return parsed as Record<string, unknown>;
  }
  async function principal(
    request: IncomingMessage,
  ): Promise<(Actor & { csrfToken?: string }) | null> {
    if (identity) return identity.authenticate(request);
    const cookieSession = request.headers.cookie
      ?.split(";")
      .map((part) => part.trim().split("="))
      .find(([name]) => name === "pvf_session")?.[1];
    const value = request.headers["x-session"] ?? cookieSession;
    if (value === "student-ava") return { id: "student-ava", role: "student" };
    if (value === "teacher-dev") return { id: "teacher-dev", role: "teacher" };
    if (value === "teacher-other")
      return { id: "teacher-other", role: "teacher" };
    return null;
  }
  function ownsClass(actor: Actor, classId: string) {
    return (
      actor.role === "teacher" &&
      directory()
        .teachers.find((teacher) => teacher.id === actor.id)
        ?.classIds.includes(classId)
    );
  }
  function classForStudent(studentId: string) {
    return directory().students.find((student) => student.id === studentId)
      ?.classId;
  }
  function receiptFor(
    attempt: Attempt,
    actor: Actor,
    commandId: string,
    payloadHash: string,
  ): Receipt | null | "conflict" {
    const receipt = attempt.receipts.find(
      (item) => item.actorId === actor.id && item.commandId === commandId,
    );
    if (!receipt) return null;
    return receipt.payloadHash === payloadHash ? receipt : "conflict";
  }
  function matchingKey(
    request: IncomingMessage,
    command: { commandId: string },
  ) {
    return request.headers["idempotency-key"] === command.commandId;
  }
  function activeLease(attempt: Attempt) {
    return Date.parse(attempt.leaseExpiresAt) > now().getTime();
  }
  function correctedSlots(attempt: Attempt) {
    const firstOrderResponse = new Map<string, ResponseRecord>();
    for (const record of attempt.responses)
      if (!record.order.id.endsWith("-transfer") && !firstOrderResponse.has(record.order.id))
        firstOrderResponse.set(record.order.id, record);
    const accepted = new Set(
      attempt.responses
        .filter((record) => !record.order.id.endsWith("-transfer") && record.validation.shipmentAccepted)
        .map((record) => record.order.id),
    );
    return [...firstOrderResponse.values()].filter(
      (record) => accepted.has(record.order.id) && !record.validation.shipmentAccepted,
    ).length;
  }
  function completedPathLevels(attempts: Attempt[]) {
    return new Set(
      attempts
        .filter((attempt) => attempt.completed && attempt.kind !== "practice")
        .map((attempt) => attempt.levelId),
    );
  }
  function bestStars(attempts: Attempt[], levelId: string) {
    return Math.max(
      0,
      ...attempts
        .filter(
          (attempt) =>
            attempt.completed &&
            attempt.kind !== "practice" &&
            attempt.levelId === levelId,
        )
        .map((attempt) => (attempt.transferStar ? 3 : 2)),
    );
  }
  function tierFor(state: Store, studentId: string) {
    const certifications = state.certifications?.[studentId] ?? [];
    const stage = Math.max(-1, ...certifications.map((item) => stageCertificationIds.indexOf(item)));
    return stage < 0 ? "Trainee" : stageDisplayTiers[stage];
  }
  function hasStageCertification(state: Store, studentId: string, stage: number) {
    const values = state.certifications?.[studentId] ?? [];
    return values.includes(stageCertificationIds[stage - 1]) || values.includes(stageDisplayTiers[stage - 1]);
  }
  function displayCertifications(state: Store, studentId: string) {
    return (state.certifications?.[studentId] ?? []).map((value) => {
      const index = stageCertificationIds.indexOf(value);
      return index >= 0 ? stageDisplayTiers[index] : value;
    });
  }
  function awardCertifications(state: Store, studentId: string) {
    const attempts = state.attempts.filter((item) => item.studentId === studentId);
    const completed = completedPathLevels(attempts);
    const evidence = attempts.flatMap((item) => item.evidence);
    state.certifications ??= {};
    const earned = state.certifications[studentId] ?? [];
    let newest: string | null = null;
    for (let stage = 1; stage <= 6; stage++) {
      const last = LEVELS.filter((level) => level.stage === stage).at(-1);
      const certification = stageCertificationIds[stage - 1];
      if (
        last && completed.has(last.id) &&
        stageGate(stage, evidence, now()).satisfied && !earned.includes(certification)
      ) {
        earned.push(certification);
        newest = certification;
      }
    }
    state.certifications[studentId] = earned;
    return newest ? stageDisplayTiers[stageCertificationIds.indexOf(newest)] : null;
  }
  function snapshot(attempt: Attempt, state?: Store) {
    return {
      attemptId: attempt.id,
      revision: attempt.revision,
      leaseEpoch: attempt.leaseEpoch,
      leaseExpiresAt: attempt.leaseExpiresAt,
      writerTabId: attempt.writerTabId,
      status: attempt.completed ? "completed" : (attempt.status ?? "active"),
      levelId: attempt.levelId,
      kind: attempt.kind ?? "path",
      configVersion: "v1-local",
      shippedSlots: attempt.slot,
      skippedOrders: attempt.skippedOrders ?? 0,
      correctedSlots: correctedSlots(attempt),
      currentHintStep:
        attempt.completed && !attempt.transferOrder
          ? "none"
          : highestHint(attempt, orderFor(attempt, state).id),
      acknowledgedCommandIds: attempt.receipts
        .map((receipt) => receipt.commandId)
        .slice(-20),
      achievedTier: state ? tierFor(state, attempt.studentId) : "Trainee",
      activeOrder:
        attempt.completed && !attempt.transferOrder
          ? null
          : publicOrder(orderFor(attempt, state)),
    };
  }
  function publicOrder(order: Order) {
    const { seed: _seed, witness: _witness, minimumAnswer: _minimumAnswer, ...visible } = order as Order & { seed?: number; witness?: unknown; minimumAnswer?: unknown };
    return visible;
  }
  function mapFor(attempts: Attempt[], certifications: string[] = []) {
    const completed = completedPathLevels(attempts);
    const highest = Math.max(
      0,
      ...LEVELS.filter((level) => completed.has(level.id)).map(
        (level) => level.ordinal,
      ),
    );
    const evidence = attempts.flatMap((attempt) => attempt.evidence);
    const eligible = (level: (typeof LEVELS)[number]) =>
      level.ordinal <= highest + 1 &&
      (level.stage === 1 ||
        level.ordinal !==
          LEVELS.find((item) => item.stage === level.stage)?.ordinal ||
        (certifications.includes(stageCertificationIds[level.stage - 2]) ||
          stageGate(level.stage - 1, evidence).satisfied));
    const zones = [...new Set(LEVELS.map((level) => level.zone))].map(
      (zone) => ({
        id: zone.toLowerCase(),
        name: zone,
        levels: LEVELS.filter((level) => level.zone === zone).map((level) => ({
          id: level.id,
          title: level.title,
          stage: level.stage,
          status: completed.has(level.id)
            ? "completed"
            : eligible(level)
              ? "unlocked"
              : "locked",
          stars: bestStars(attempts, level.id),
          prerequisiteSummary: eligible(level)
            ? "Ready to practice"
            : level.ordinal <= highest + 1
              ? `Practice required skills before Stage ${level.stage}`
              : `Complete Level ${level.ordinal - 1} first`,
        })),
      }),
    );
    return {
      configVersion: "v1-local",
      zones,
      achievedTier: certifications.length ? (() => { const stage = Math.max(-1, ...certifications.map((item) => stageCertificationIds.indexOf(item))); return stage < 0 ? certifications.at(-1) ?? "Trainee" : stageDisplayTiers[stage]; })() : "Trainee",
      certifications: certifications.map((value) => { const index = stageCertificationIds.indexOf(value); return index >= 0 ? stageDisplayTiers[index] : value; }),
      profileRevision: completed.size,
      highestUnlockedLevelId: LEVELS.filter(eligible).at(-1)?.id ?? "level-1",
      lastCompletedEfficiency: (() => {
        const last = attempts
          .filter((attempt) => attempt.completed && attempt.kind !== "practice")
          .at(-1);
        return last ? result(last).efficiency : null;
      })(),
    };
  }
  function responseError(
    code: string,
    message: string,
    currentRevision?: number,
  ) {
    return {
      error: {
        code,
        message,
        ...(currentRevision === undefined ? {} : { currentRevision }),
      },
    };
  }
  function result(attempt: Attempt, allAttempts: Attempt[] = [attempt]) {
    const firstPerOrder = new Map<string, ResponseRecord>();
    for (const record of attempt.responses)
      if (!record.order.id.endsWith("-transfer") && !firstPerOrder.has(record.order.id))
        firstPerOrder.set(record.order.id, record);
    let currentStreak = 0;
    let bestStreak = 0;
    for (const record of firstPerOrder.values()) {
      currentStreak = record.validation.objectiveMet ? currentStreak + 1 : 0;
      bestStreak = Math.max(bestStreak, currentStreak);
    }
    const skillStatuses = [
      ...new Set(attempt.evidence.map((item) => item.skillId)),
    ].map((skillId) => summarizeMastery(skillId, allAttempts.flatMap((item) => item.evidence)));
    const next = LEVELS.find(
      (level) => level.ordinal === Number(attempt.levelId.slice(6)) + 1,
    );
    const nextUnlocked =
      next &&
      (next.stage === levelById(attempt.levelId)?.stage ||
        allAttempts.some((item) => item.awardedTier === stageDisplayTiers[next.stage - 2]) ||
        stageGate(next.stage - 1, allAttempts.flatMap((item) => item.evidence))
          .satisfied);
    return {
      attemptId: attempt.id,
      completed: true,
      shipped: 5,
      submittedOrders: firstPerOrder.size,
      firstObjectiveCorrect: [...firstPerOrder.values()].filter(
        (item) => item.validation.objectiveMet,
      ).length,
      firstValueCorrect: [...firstPerOrder.values()].filter(
        (item) => item.validation.valueMatches,
      ).length,
      eventuallyCorrect: 5,
      bestStreak,
      skillStatuses,
      correctedSlots: correctedSlots(attempt),
      skippedOrders: attempt.skippedOrders ?? 0,
      efficiency: Math.max(0, 100 - 6 * correctedSlots(attempt) - 4 * Math.min(5, attempt.skippedOrders ?? 0)),
      mainStars: attempt.kind === "practice" ? 0 : 2,
      transferStar: attempt.kind === "practice" ? false : (attempt.transferStar ?? false),
      bestLevelStars: attempt.kind === "practice" ? 0 : bestStars(allAttempts, attempt.levelId),
      newlyUnlockedLevelIds:
        attempt.kind !== "path" || !nextUnlocked ? [] : [next.id],
      newlyEarnedTier: attempt.awardedTier ?? null,
      policyVersion: "v1-local",
    };
  }
  function nextDifficulty(
    attempt: Attempt,
    state?: Store,
  ): "easy" | "medium" | "hard" {
    const practiceSkill =
      attempt.practiceSchedule?.[attempt.slot] ?? attempt.practiceSkill;
    const nextOrder =
      attempt.kind === "practice" && practiceSkill
        ? generatePracticeOrder(
            practiceSkill,
            attempt.seed,
            attempt.slot,
            "easy",
            Number(attempt.levelId.slice(6)),
          )
        : generateLevelOrder(
            attempt.levelId,
            attempt.seed,
            attempt.slot,
            "easy",
          );
    return difficultyForStudentSkill(
      state,
      attempt.studentId,
      nextOrder.primarySkill ?? "unknown",
      attempt.evidence,
    );
  }
  function difficultyForStudentSkill(
    state: Store | undefined,
    studentId: string,
    skill: string,
    fallback: EvidenceRecord[] = [],
  ): "easy" | "medium" | "hard" {
    const history =
      state?.attempts
        .filter((item) => item.studentId === studentId)
        .flatMap((item) => item.evidence) ?? fallback;
    return adaptedDifficulty(
      summarizeMastery(skill, history),
      scaffoldForSkill(skill, history),
    );
  }
  function orderFor(attempt: Attempt, state?: Store) {
    const practiceSkill =
      attempt.practiceSchedule?.[attempt.slot] ?? attempt.practiceSkill;
    return (
      attempt.transferOrder ??
      attempt.activeOrder ??
      issuedOrder(
        attempt.id,
        attempt.kind === "practice" && practiceSkill
          ? generatePracticeOrder(
              practiceSkill,
              attempt.seed,
              attempt.slot,
              nextDifficulty(attempt, state),
              Number(attempt.levelId.slice(6)),
            )
          : generateLevelOrder(
              attempt.levelId,
              attempt.seed,
              attempt.slot,
              nextDifficulty(attempt, state),
            ),
        attempt.slot,
        attempt.replacementIndex ?? 0,
        attempt.seed,
      )
    );
  }
  function recentSignatures(state: Store, studentId: string) {
    return state.attempts
      .filter((item) => item.studentId === studentId)
      .flatMap((item) => item.issuedOrders ?? [])
      .map(({ spec }) => orderSignature(spec))
      .slice(-10);
  }
  function generatedForAttempt(attempt: Attempt, state: Store, slot: number, seed: number, band: "easy" | "medium" | "hard") {
    const skill = attempt.practiceSchedule?.[slot] ?? attempt.practiceSkill;
    return attempt.kind === "practice" && skill
      ? generatePracticeOrder(skill, seed, slot, band, Number(attempt.levelId.slice(6)), recentSignatures(state, attempt.studentId))
      : generateLevelOrder(attempt.levelId, seed, slot, band, recentSignatures(state, attempt.studentId));
  }
  function retainIssuedOrder(attempt: Attempt, spec: Order, slot: number, replacement: number, role: "main" | "transfer" = "main") {
    attempt.issuedOrders ??= [];
    if (!attempt.issuedOrders.some((entry) => entry.spec.id === spec.id))
      attempt.issuedOrders.push({ spec, slot: Math.min(slot, 4), replacement, role, status: "active" });
  }
  function issuedOrder(
    attemptId: string, generated: Order, slot: number, replacement: number,
    seed: number, role: "main" | "transfer" = "main",
  ): Order {
    return {
      ...generated,
      id: `${attemptId}.${generated.id}${role === "transfer" ? "-transfer" : ""}`,
      attemptId,
      slotIndex: slot,
      replacementIndex: replacement,
      role,
      seed,
      configVersion: "v1-local",
      engineVersion: "xorshift32-v1",
      forbidden: DENOMINATIONS.filter((place) => !generated.allowed.includes(place)),
      skillIds: generated.primarySkill ? [generated.primarySkill] : [],
    };
  }
  function highestHint(attempt: Attempt, orderId: string): HintStep | "none" {
    const steps: HintStep[] = ["H1", "H2", "H3"];
    return attempt.supportEvents
      .filter((event) => event.orderId === orderId)
      .reduce<
        HintStep | "none"
      >((highest, event) => (highest === "none" || steps.indexOf(event.step) > steps.indexOf(highest) ? event.step : highest), "none");
  }
  function hintFor(order: Order, step: HintStep) {
    if (step === "H1")
      return {
        code: "BASE_TEN_RELATIONSHIP",
        params: {
          message:
            "One crate in a place is worth ten crates in the next smaller place.",
        },
      };
    if (step === "H2")
      return {
        code: "DIFFERENT_TARGET_EXAMPLE",
        params: {
          message:
            "For example, 3 tens and 4 ones make 34. Build the same kind of place-value total for this order.",
        },
        workedExample: { target: 34, representationA: [0, 0, 0, 0, 3, 4] },
      };
    return {
      code: "CURRENT_ORDER_MODEL",
      params: { message: "Here is one representation for this target." },
      workedExample: {
        target: order.target,
        representationA: witnessFor(order),
      },
    };
  }

  const handle = async (request: IncomingMessage, response: ServerResponse) => {
    try {
      if (request.method === "OPTIONS") return send(response, 204);
      const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
      if (
        identity &&
        !["GET", "HEAD", "OPTIONS"].includes(request.method ?? "") &&
        request.headers.origin !== origin!.origin
      )
        throw new AccessError(
          403,
          "ORIGIN_REJECTED",
          "Please use the classroom app to make changes.",
        );
      if (
        identity &&
        request.method === "POST" &&
        [
          "/api/v1/auth/student/session",
          "/api/v1/auth/teacher/session",
        ].includes(url.pathname)
      ) {
        const login = await identity.login(
          url.pathname.includes("/teacher/") ? "teacher" : "student",
          await json(request),
          sessionToken(request),
        );
        return send(
          response,
          200,
          { principal: login.principal, csrfToken: login.csrfToken },
          {
            "set-cookie": sessionCookie(
              login.token,
              origin!.protocol === "https:",
            ),
          },
        );
      }
      if (
        request.method === "POST" &&
        url.pathname === "/api/v1/auth/student/session"
      ) {
        const body = await json(request);
        const student = developmentStudents.find(
          (item) =>
            item.classCode === String(body.classCode).trim().toUpperCase() &&
            item.username === String(body.username).trim().toLowerCase() &&
            item.pin === body.pin,
        );
        const state = await store();
        return student && state.studentAccess?.[student.id] !== false
          ? send(
              response,
              200,
              {
                principal: {
                  id: student.id,
                  role: "student",
                  classId: student.classId,
                },
                csrfToken: "local-dev",
              },
              {
                "set-cookie": `pvf_session=${student.id}; HttpOnly; SameSite=Lax; Path=/api/v1`,
              },
            )
          : send(
              response,
              401,
              responseError(
                "INVALID_CREDENTIALS",
                "Those login details did not match.",
              ),
            );
      }
      if (
        request.method === "POST" &&
        url.pathname === "/api/v1/auth/teacher/session"
      ) {
        const body = await json(request);
        const teacher = developmentTeachers.find(
          (item) =>
            item.username === body.username && item.password === body.password,
        );
        return teacher
          ? send(
              response,
              200,
              {
                principal: { id: teacher.id, role: "teacher" },
                csrfToken: "local-dev",
              },
              {
                "set-cookie": `pvf_session=${teacher.id}; HttpOnly; SameSite=Lax; Path=/api/v1`,
              },
            )
          : send(
              response,
              401,
              responseError(
                "INVALID_CREDENTIALS",
                "Those login details did not match.",
              ),
            );
      }
      const actor = await principal(request);
      if (
        identity &&
        actor &&
        !["GET", "HEAD", "OPTIONS"].includes(request.method ?? "") &&
        request.headers["x-csrf-token"] !== actor.csrfToken
      )
        throw new AccessError(
          403,
          "CSRF_REJECTED",
          "Please refresh your session before making changes.",
        );
      if (
        identity &&
        actor &&
        request.method === "DELETE" &&
        url.pathname === "/api/v1/auth/session"
      ) {
        await identity.logout(request);
        return send(response, 204, undefined, {
          "set-cookie": sessionCookie(
            "",
            origin!.protocol === "https:",
          ).replace("Max-Age=28800", "Max-Age=0"),
        });
      }
      if (request.method === "GET" && url.pathname === "/api/v1/auth/session")
        return actor
          ? send(response, 200, {
              ...(identity ? { csrfToken: actor.csrfToken } : {}),
              principal: {
                id: actor.id,
                role: actor.role,
                ...(actor.role === "student"
                  ? { classId: classForStudent(actor.id) }
                  : {}),
              },
            })
          : send(
              response,
              401,
              responseError("SESSION_EXPIRED", "Please sign in."),
            );
      if (!actor)
        return send(
          response,
          401,
          responseError("SESSION_EXPIRED", "Please sign in."),
        );
      if (
        url.pathname.startsWith("/api/v1/teacher/") &&
        actor.role !== "teacher"
      )
        throw new AccessError(
          403,
          "NOT_AUTHORIZED",
          "Teacher access is required.",
        );
      if (
        identity &&
        url.pathname.startsWith("/api/v1/teacher/") &&
        !["GET", "HEAD", "OPTIONS"].includes(request.method ?? "")
      ) {
        const roster = await identity.roster(
          request.method ?? "",
          url.pathname,
          actor,
          await json(request),
          request.headers["idempotency-key"],
        );
        if (roster) return send(response, roster.status, roster.body);
        throw new AccessError(404, "NOT_FOUND", "Route not found.");
      }
      if (actor.role === "student") {
        const state = await store();
        if (state.studentAccess?.[actor.id] === false)
          return send(
            response,
            403,
            responseError("ACCESS_DISABLED", "Access is disabled."),
          );
      }
      if (
        request.method === "GET" &&
        url.pathname === "/api/v1/games/place-value-factory/map" &&
        actor.role === "student"
      )
        return send(
          response,
          200,
          mapFor(
            (await store()).attempts.filter(
              (attempt) => attempt.studentId === actor.id,
            ),
            (await store()).certifications?.[actor.id] ?? [],
          ),
        );
      if (
        request.method === "GET" &&
        url.pathname === "/api/v1/profile" &&
        actor.role === "student"
      ) {
        const state = await store();
        const attempts = state.attempts.filter(
          (attempt) => attempt.studentId === actor.id,
        );
        const map = mapFor(attempts, state.certifications?.[actor.id] ?? []);
        return send(response, 200, {
          studentAlias:
            directory().students.find((student) => student.id === actor.id)
              ?.alias ?? "Student",
          gameKey: "place-value-factory",
          highestUnlockedLevelId: map.highestUnlockedLevelId,
          achievedTier: tierFor(state, actor.id),
          certifications: state.certifications?.[actor.id] ?? [],
          totalStars: LEVELS.reduce(
            (total, level) => total + bestStars(attempts, level.id),
            0,
          ),
          maxStars: 90,
          settings: {
            sound: false,
            reducedMotion: false,
            pressure: "calm",
            textScale: "normal",
            ...state.settings?.[actor.id],
          },
          revision: map.profileRevision,
          activeAttemptId:
            attempts.find((attempt) => !attempt.completed)?.id ?? null,
        });
      }
      if (
        request.method === "GET" &&
        url.pathname === "/api/v1/games/place-value-factory/progress" &&
        actor.role === "student"
      ) {
        const attempts = (await store()).attempts.filter(
          (attempt) => attempt.studentId === actor.id,
        );
        const evidence = attempts.flatMap((attempt) => attempt.evidence);
        const skillIds = [
          ...new Set([
            ...Object.values(STAGE_GATE_SKILLS).flat(),
            ...evidence.map((record) => record.skillId),
          ]),
        ].sort();
        const completedLevels = completedPathLevels(attempts);
        const highestCompleted = Math.max(
          0,
          ...LEVELS.filter((level) => completedLevels.has(level.id)).map(
            (level) => level.ordinal,
          ),
        );
        const nextLevel = LEVELS.find(
          (level) => level.ordinal === highestCompleted + 1,
        );
        const gateSkills = highestCompleted === 30
          ? STAGE_GATE_SKILLS[6]
          : nextLevel && nextLevel.stage > 1
            ? STAGE_GATE_SKILLS[nextLevel.stage - 1]
            : STAGE_GATE_SKILLS[1];
        return send(response, 200, {
          skills: skillIds.map((skillId) =>
            summarizeMastery(skillId, evidence),
          ),
          nextPracticeSkillId: nextPracticeSkill(gateSkills, evidence),
          completedLevelIds: LEVELS.filter((level) =>
            completedLevels.has(level.id),
          ).map((level) => level.id),
        });
      }
      if (
        request.method === "PATCH" &&
        url.pathname === "/api/v1/profile/settings" &&
        actor.role === "student"
      ) {
        const body = await json(request);
        const settings = body.settings as Partial<Settings> | undefined;
        if (
          !settings ||
          typeof settings.sound !== "boolean" ||
          typeof settings.reducedMotion !== "boolean" ||
          (settings.pressure !== "calm" && settings.pressure !== "busy") ||
          (settings.textScale !== "normal" && settings.textScale !== "large")
        )
          return send(
            response,
            422,
            responseError("INVALID_INPUT", "Choose supported settings."),
          );
        const state = await store();
        state.settings ??= {};
        state.settings[actor.id] = settings as Settings;
        await save(state);
        return send(response, 200, { settings: state.settings[actor.id] });
      }
      if (
        request.method === "POST" &&
        url.pathname === "/api/v1/games/place-value-factory/attempts" &&
        actor.role === "student"
      ) {
        const body = await json(request);
        const command = startCommandFrom(body);
        if (!command || !matchingKey(request, command))
          return send(
            response,
            422,
            responseError(
              "INVALID_INPUT",
              "A command ID, profile revision, tab ID, and matching Idempotency-Key are required.",
            ),
          );
        const state = await store();
        let attempt = state.attempts.find(
          (item) => item.studentId === actor.id && !item.completed,
        );
        const payloadHash = hashPayload(body);
        for (const owned of state.attempts.filter(
          (item) => item.studentId === actor.id,
        )) {
          const prior = receiptFor(
            owned,
            actor,
            command.commandId,
            payloadHash,
          );
          if (prior === "conflict")
            return send(
              response,
              409,
              responseError(
                "IDEMPOTENCY_CONFLICT",
                "This command was already used for different work.",
              ),
            );
          if (prior) return send(response, prior.status, prior.body);
        }
        const isPractice = body.kind === "practice";
        const requestedLevel = levelById(
          typeof body.levelId === "string" ? body.levelId : "level-1",
        );
        const completed = completedPathLevels(
          state.attempts.filter((item) => item.studentId === actor.id),
        );
        const highest = Math.max(
          0,
          ...LEVELS.filter((level) => completed.has(level.id)).map(
            (level) => level.ordinal,
          ),
        );
        const evidence = state.attempts
          .filter((item) => item.studentId === actor.id)
          .flatMap((item) => item.evidence);
        const firstOfStage =
          requestedLevel &&
          LEVELS.find((item) => item.stage === requestedLevel.stage)?.id ===
            requestedLevel.id;
        const stageAccessAllowed = requestedLevel?.stage === 1 || !requestedLevel ||
          hasStageCertification(state, actor.id, requestedLevel.stage - 1) ||
          stageGate(requestedLevel.stage - 1, evidence, now()).satisfied ||
          Boolean(state.levelAccessOverrides?.some((override) =>
            override.studentId === actor.id &&
            override.levelId === requestedLevel.id &&
            override.enabled,
          ));
        if (
          !requestedLevel ||
          (!isPractice &&
            (requestedLevel.ordinal > highest + 1 ||
              (firstOfStage && !stageAccessAllowed)))
        )
          return send(
            response,
            409,
            responseError(
              "LEVEL_LOCKED",
              "Complete the earlier level and practice the required skills first.",
            ),
          );
        if (command.profileRevision !== completed.size)
          return send(
            response,
            409,
            responseError(
              "REVISION_CONFLICT",
              "Progress changed. Reloading your saved work.",
              completed.size,
            ),
          );
        if (attempt) return send(response, 200, snapshot(attempt, state));
        const issuedAt = now();
        const usedSeeds = new Set(
          state.attempts
            .filter((item) => item.studentId === actor.id)
            .map((item) => item.seed),
        );
        let seed = randomBytes(4).readUInt32BE(0);
        while (seed === 0 || usedSeeds.has(seed))
          seed = randomBytes(4).readUInt32BE(0);
        const gateStage =
          highest >= 30
            ? 6
            : highest < 4
              ? 1
              : Math.min(
                  6,
                  (levelById(`level-${highest + 1}`)?.stage ?? 6) - 1,
                );
        const gateSkills = STAGE_GATE_SKILLS[gateStage] ?? STAGE_GATE_SKILLS[1];
        const practiceSchedule = isPractice
          ? schedulePracticeSkills(gateSkills, evidence, gateSkills, now())
          : undefined;
        const practiceSkill =
          practiceSchedule?.[0] ??
          (isPractice
            ? (nextPracticeSkill(gateSkills, evidence, now()) ?? gateSkills[0])
            : undefined);
        const attemptLevel = requestedLevel;
        const attemptId = randomUUID();
        const initialTemplate =
          isPractice && practiceSkill
            ? generatePracticeOrder(
                practiceSkill,
                seed,
                0,
                "easy",
                Math.min(30, Math.max(1, highest + 1)),
                recentSignatures(state, actor.id),
              )
            : generateLevelOrder(
                requestedLevel.id,
                seed,
                0,
                "easy",
                recentSignatures(state, actor.id),
              );
        const initialBand = difficultyForStudentSkill(
          state,
          actor.id,
          initialTemplate.primarySkill ?? "unknown",
        );
        const initialOrder =
          initialBand === "easy"
            ? initialTemplate
            : isPractice && practiceSkill
              ? generatePracticeOrder(
                  practiceSkill,
                  seed,
                  0,
                  initialBand,
                  Math.min(30, Math.max(1, highest + 1)),
                  recentSignatures(state, actor.id),
                )
              : generateLevelOrder(
                  requestedLevel.id,
                  seed,
                  0,
                  initialBand,
                  recentSignatures(state, actor.id),
                );
        attempt = {
          id: attemptId,
          studentId: actor.id,
          levelId: attemptLevel.id,
          seed,
          slot: 0,
          replacementIndex: 0,
          skippedOrders: 0,
          activeOrder: issuedOrder(attemptId, initialOrder, 0, 0, seed),
          responses: [],
          completed: false,
          status: "active",
          createdAt: issuedAt.toISOString(),
          revision: 0,
          leaseEpoch: 1,
          writerTabId: command.tabId,
          leaseExpiresAt: new Date(issuedAt.getTime() + leaseDurationMs).toISOString(),
          receipts: [],
          evidence: [],
          supportEvents: [],
          kind: isPractice
            ? "practice"
            : completed.has(requestedLevel.id)
              ? "replay"
              : "path",
          practiceSkill,
          practiceSchedule,
          issuedOrders: [],
        };
        if (attempt.activeOrder)
          retainIssuedOrder(attempt, attempt.activeOrder, 0, 0);
        state.attempts.push(attempt);
        const startedSnapshot = snapshot(attempt, state);
        attempt.receipts.push({
          actorId: actor.id,
          commandId: command.commandId,
          payloadHash,
          status: 201,
          body: startedSnapshot,
        });
        await save(state);
        return send(response, 201, startedSnapshot);
      }
      const stateChange = url.pathname.match(
        /^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)\/(pause|resume)$/,
      );
      if (
        stateChange &&
        request.method === "POST" &&
        actor.role === "student"
      ) {
        const body = await json(request);
        const command = commandFrom(body);
        if (!command || !matchingKey(request, command))
          return send(
            response,
            422,
            responseError(
              "INVALID_INPUT",
              "A command and matching Idempotency-Key are required.",
            ),
          );
        const state = await store();
        const attempt = state.attempts.find(
          (item) => item.id === stateChange[1] && item.studentId === actor.id,
        );
        if (!attempt || attempt.completed)
          return send(
            response,
            404,
            responseError("NOT_FOUND", "Attempt not found."),
          );
        const payloadHash = hashPayload(body);
        const prior = receiptFor(
          attempt,
          actor,
          command.commandId,
          payloadHash,
        );
        if (prior === "conflict")
          return send(
            response,
            409,
            responseError(
              "IDEMPOTENCY_CONFLICT",
              "This command ID was used with a different request.",
            ),
          );
        if (prior) return send(response, prior.status, prior.body);
        if (
          command.expectedRevision !== attempt.revision ||
          command.leaseEpoch !== attempt.leaseEpoch ||
          attempt.writerTabId !== command.tabId
        )
          return send(
            response,
            409,
            responseError("LEASE_LOST", "Another tab is editing this attempt."),
          );
        if (!activeLease(attempt)) attempt.leaseEpoch += 1;
        attempt.status = stateChange[2] === "pause" ? "paused" : "active";
        attempt.writerTabId = command.tabId;
        attempt.leaseExpiresAt = new Date(now().getTime() + leaseDurationMs).toISOString();
        attempt.revision += 1;
        const bodyOut = {
          commandId: command.commandId,
          snapshot: snapshot(attempt, state),
        };
        attempt.receipts.push({
          actorId: actor.id,
          commandId: command.commandId,
          payloadHash,
          status: 200,
          body: bodyOut,
        });
        await save(state);
        return send(response, 200, bodyOut);
      }
      const heartbeat = url.pathname.match(
        /^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)\/lease\/heartbeat$/,
      );
      if (heartbeat && request.method === "POST" && actor.role === "student") {
        const body = await json(request);
        const command = commandFrom(body);
        if (!command || !matchingKey(request, command))
          return send(
            response,
            422,
            responseError(
              "INVALID_INPUT",
              "A command and matching Idempotency-Key are required.",
            ),
          );
        const state = await store();
        const attempt = state.attempts.find(
          (item) => item.id === heartbeat[1] && item.studentId === actor.id,
        );
        if (!attempt)
          return send(
            response,
            404,
            responseError("NOT_FOUND", "Attempt not found."),
          );
        const payloadHash = hashPayload(body);
        const prior = receiptFor(
          attempt,
          actor,
          command.commandId,
          payloadHash,
        );
        if (prior === "conflict")
          return send(
            response,
            409,
            responseError(
              "IDEMPOTENCY_CONFLICT",
              "This command ID was used with a different request.",
            ),
          );
        if (prior) return send(response, prior.status, prior.body);
        if (command.expectedRevision !== attempt.revision)
          return send(
            response,
            409,
            responseError(
              "REVISION_CONFLICT",
              "Progress changed. Reloading your saved work.",
              attempt.revision,
            ),
          );
        if (
          command.leaseEpoch !== attempt.leaseEpoch ||
          attempt.writerTabId !== command.tabId ||
          !activeLease(attempt)
        )
          return send(
            response,
            409,
            responseError("LEASE_LOST", "Another tab is editing this attempt."),
          );
        attempt.leaseExpiresAt = new Date(now().getTime() + leaseDurationMs).toISOString();
        const bodyOut = {
          commandId: command.commandId,
          leaseEpoch: attempt.leaseEpoch,
          leaseExpiresAt: attempt.leaseExpiresAt,
        };
        attempt.receipts.push({
          actorId: actor.id,
          commandId: command.commandId,
          payloadHash,
          status: 200,
          body: bodyOut,
        });
        await save(state);
        return send(response, 200, bodyOut);
      }
      const takeover = url.pathname.match(
        /^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)\/lease\/takeover$/,
      );
      if (takeover && request.method === "POST" && actor.role === "student") {
        const body = await json(request);
        const command = commandFrom(body);
        if (!command || !matchingKey(request, command))
          return send(
            response,
            422,
            responseError(
              "INVALID_INPUT",
              "A command and matching Idempotency-Key are required.",
            ),
          );
        const state = await store();
        const attempt = state.attempts.find(
          (item) => item.id === takeover[1] && item.studentId === actor.id,
        );
        if (!attempt)
          return send(
            response,
            404,
            responseError("NOT_FOUND", "Attempt not found."),
          );
        const payloadHash = hashPayload(body);
        const prior = receiptFor(
          attempt,
          actor,
          command.commandId,
          payloadHash,
        );
        if (prior === "conflict")
          return send(
            response,
            409,
            responseError(
              "IDEMPOTENCY_CONFLICT",
              "This command ID was used with a different request.",
            ),
          );
        if (prior) return send(response, prior.status, prior.body);
        if (command.expectedRevision !== attempt.revision)
          return send(
            response,
            409,
            responseError(
              "REVISION_CONFLICT",
              "Progress changed. Reloading your saved work.",
              attempt.revision,
            ),
          );
        attempt.leaseEpoch += 1;
        attempt.writerTabId = command.tabId;
        attempt.leaseExpiresAt = new Date(now().getTime() + leaseDurationMs).toISOString();
        attempt.revision += 1;
        const bodyOut = {
          commandId: command.commandId,
          snapshot: snapshot(attempt, state),
        };
        attempt.receipts.push({
          actorId: actor.id,
          commandId: command.commandId,
          payloadHash,
          status: 200,
          body: bodyOut,
        });
        await save(state);
        return send(response, 200, bodyOut);
      }
      const hints = url.pathname.match(
        /^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)\/orders\/([^/]+)\/hints$/,
      );
      if (hints && request.method === "POST" && actor.role === "student") {
        const body = await json(request);
        const command = commandFrom(body);
        const step = body.step;
        if (
          !command ||
          !matchingKey(request, command) ||
          (step !== "H1" && step !== "H2" && step !== "H3")
        )
          return send(
            response,
            422,
            responseError(
              "INVALID_INPUT",
              "A command, matching Idempotency-Key, and hint step are required.",
            ),
          );
        const state = await store();
        const attempt = state.attempts.find(
          (item) => item.id === hints[1] && item.studentId === actor.id,
        );
        if (!attempt || attempt.completed || attempt.status === "paused")
          return send(
            response,
            409,
            responseError("ORDER_NOT_ACTIVE", "That order is not active."),
          );
        const payloadHash = hashPayload(body);
        const prior = receiptFor(
          attempt,
          actor,
          command.commandId,
          payloadHash,
        );
        if (prior === "conflict")
          return send(
            response,
            409,
            responseError(
              "IDEMPOTENCY_CONFLICT",
              "This command ID was used with a different request.",
            ),
          );
        if (prior) return send(response, prior.status, prior.body);
        if (
          command.leaseEpoch !== attempt.leaseEpoch ||
          attempt.writerTabId !== command.tabId
        )
          return send(
            response,
            409,
            responseError("LEASE_LOST", "Another tab is editing this attempt."),
          );
        if (command.expectedRevision !== attempt.revision)
          return send(
            response,
            409,
            responseError(
              "REVISION_CONFLICT",
              "Progress changed. Reloading your saved work.",
              attempt.revision,
            ),
          );
        const order = orderFor(attempt, state);
        if (order.id !== hints[2])
          return send(
            response,
            409,
            responseError("ORDER_NOT_ACTIVE", "That order is not active."),
          );
        const steps: HintStep[] = ["H1", "H2", "H3"];
        const currentHint = highestHint(attempt, order.id);
        const requestedIndex = steps.indexOf(step);
        const currentIndex =
          currentHint === "none" ? -1 : steps.indexOf(currentHint);
        if (requestedIndex > currentIndex + 1)
          return send(
            response,
            409,
            responseError(
              "HINT_OUT_OF_SEQUENCE",
              "Choose the next help step first.",
            ),
          );
        if (requestedIndex === currentIndex + 1) {
          attempt.supportEvents.push({
            orderId: order.id,
            step,
            at: now().toISOString(),
          });
          attempt.revision += 1;
        }
        const bodyOut = {
          commandId: command.commandId,
          snapshot: snapshot(attempt, state),
          hint: hintFor(order, step),
        };
        attempt.receipts.push({
          actorId: actor.id,
          commandId: command.commandId,
          payloadHash,
          status: 200,
          body: bodyOut,
        });
        await save(state);
        return send(response, 200, bodyOut);
      }
      const skip = url.pathname.match(
        /^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)\/orders\/([^/]+)\/skip$/,
      );
      if (skip && request.method === "POST" && actor.role === "student") {
        const body = await json(request);
        const command = commandFrom(body);
        if (!command || !matchingKey(request, command))
          return send(
            response,
            422,
            responseError(
              "INVALID_INPUT",
              "A command and matching Idempotency-Key are required.",
            ),
          );
        const state = await store();
        const attempt = state.attempts.find(
          (item) => item.id === skip[1] && item.studentId === actor.id,
        );
        if (!attempt || attempt.completed || attempt.status === "paused")
          return send(
            response,
            409,
            responseError("ORDER_NOT_ACTIVE", "That order is not active."),
          );
        const payloadHash = hashPayload(body);
        const prior = receiptFor(
          attempt,
          actor,
          command.commandId,
          payloadHash,
        );
        if (prior === "conflict")
          return send(
            response,
            409,
            responseError(
              "IDEMPOTENCY_CONFLICT",
              "This command ID was used with a different request.",
            ),
          );
        if (prior) return send(response, prior.status, prior.body);
        if (
          command.leaseEpoch !== attempt.leaseEpoch ||
          attempt.writerTabId !== command.tabId
        )
          return send(
            response,
            409,
            responseError("LEASE_LOST", "Another tab is editing this attempt."),
          );
        if (command.expectedRevision !== attempt.revision)
          return send(
            response,
            409,
            responseError(
              "REVISION_CONFLICT",
              "Progress changed. Reloading your saved work.",
              attempt.revision,
            ),
          );
        const order = orderFor(attempt, state);
        const wrongN = attempt.responses.filter(
          (record) =>
            record.order.id === order.id && !record.validation.objectiveMet,
        ).length;
        if (order.id !== skip[2] || wrongN < 2)
          return send(
            response,
            409,
            responseError(
              "ORDER_NOT_ACTIVE",
              "Try two saved adjustments before skipping.",
            ),
          );
        attempt.evidence.push({
          orderId: order.id,
          skillId: order.primarySkill ?? "unknown",
          score: 0,
          independentFirst: false,
          attemptId: attempt.id,
          signature: `${order.target}:${order.allowed.join(",")}:${order.mode ?? ""}`,
          committedAt: now().toISOString(),
        });
        attempt.replacementIndex = (attempt.replacementIndex ?? 0) + 1;
        attempt.skippedOrders = (attempt.skippedOrders ?? 0) + 1;
        const replacementSeed = ((attempt.seed + attempt.replacementIndex * 997) >>> 0) || 1;
        attempt.activeOrder = issuedOrder(
          attempt.id,
          generatedForAttempt(attempt, state, attempt.slot, replacementSeed, "easy"),
          attempt.slot,
          attempt.replacementIndex,
          replacementSeed,
        );
        retainIssuedOrder(attempt, attempt.activeOrder, attempt.slot, attempt.replacementIndex);
        attempt.revision += 1;
        const bodyOut = {
          commandId: command.commandId,
          snapshot: snapshot(attempt, state),
        };
        attempt.receipts.push({
          actorId: actor.id,
          commandId: command.commandId,
          payloadHash,
          status: 200,
          body: bodyOut,
        });
        await save(state);
        return send(response, 200, bodyOut);
      }
      const transfer = url.pathname.match(
        /^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)\/transfer$/,
      );
      if (transfer && request.method === "POST" && actor.role === "student") {
        const body = await json(request);
        const command = commandFrom(body);
        if (!command || !matchingKey(request, command))
          return send(
            response,
            422,
            responseError(
              "INVALID_INPUT",
              "A command and matching Idempotency-Key are required.",
            ),
          );
        const state = await store();
        const attempt = state.attempts.find(
          (item) => item.id === transfer[1] && item.studentId === actor.id,
        );
        if (!attempt || !attempt.completed || attempt.kind === "practice")
          return send(
            response,
            409,
            responseError(
              "NOT_COMPLETE",
              "Finish the five main shipments first.",
            ),
          );
        const payloadHash = hashPayload(body);
        const prior = receiptFor(
          attempt,
          actor,
          command.commandId,
          payloadHash,
        );
        if (prior === "conflict")
          return send(
            response,
            409,
            responseError(
              "IDEMPOTENCY_CONFLICT",
              "This command ID was used with a different request.",
            ),
          );
        if (prior) return send(response, prior.status, prior.body);
        if (command.expectedRevision !== attempt.revision)
          return send(
            response,
            409,
            responseError(
              "REVISION_CONFLICT",
              "Progress changed. Reloading your saved work.",
              attempt.revision,
            ),
          );
        if (attempt.transferOrder)
          return send(response, 200, {
            commandId: command.commandId,
            snapshot: snapshot(attempt, state),
          });
        const base = generateLevelOrder(
          attempt.levelId,
          ((attempt.seed + 10_007) >>> 0) || 1,
          4,
          "easy",
        );
        attempt.transferOrder = issuedOrder(
          attempt.id, base, 4, (attempt.replacementIndex ?? 0) + 1,
          ((attempt.seed + 10_007) >>> 0) || 1, "transfer",
        );
        retainIssuedOrder(attempt, attempt.transferOrder, 4, (attempt.replacementIndex ?? 0) + 1, "transfer");
        attempt.writerTabId = command.tabId;
        attempt.leaseEpoch += 1;
        attempt.leaseExpiresAt = new Date(now().getTime() + leaseDurationMs).toISOString();
        attempt.revision += 1;
        const bodyOut = {
          commandId: command.commandId,
          snapshot: snapshot(attempt, state),
        };
        attempt.receipts.push({
          actorId: actor.id,
          commandId: command.commandId,
          payloadHash,
          status: 200,
          body: bodyOut,
        });
        await save(state);
        return send(response, 200, bodyOut);
      }
      const match = url.pathname.match(
        /^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)(?:\/orders\/([^/]+)\/responses|\/results)?$/,
      );
      if (match && actor.role === "student") {
        const state = await store();
        const attempt = state.attempts.find(
          (item) => item.id === match[1] && item.studentId === actor.id,
        );
        if (!attempt)
          return send(
            response,
            404,
            responseError("NOT_FOUND", "Attempt not found."),
          );
        if (request.method === "GET" && url.pathname.endsWith("/results"))
          return attempt.completed
            ? send(response, 200, result(attempt, state.attempts.filter((item) => item.studentId === actor.id)))
            : send(
                response,
                409,
                responseError("NOT_COMPLETE", "This attempt is not complete."),
              );
        if (request.method === "GET")
          return send(response, 200, snapshot(attempt, state));
        if (request.method === "POST" && match[2]) {
          const body = await json(request);
          const command = commandFrom(body);
          if (!command || !matchingKey(request, command))
            return send(
              response,
              422,
              responseError(
                "INVALID_INPUT",
                "A command and matching Idempotency-Key are required.",
              ),
            );
          const payloadHash = hashPayload(body);
          const existing = receiptFor(
            attempt,
            actor,
            command.commandId,
            payloadHash,
          );
          if (existing === "conflict")
            return send(
              response,
              409,
              responseError(
                "IDEMPOTENCY_CONFLICT",
                "This command ID was used with a different request.",
              ),
            );
          if (existing) return send(response, existing.status, existing.body);
          if (
            command.leaseEpoch !== attempt.leaseEpoch ||
            command.tabId !== attempt.writerTabId
          )
            return send(
              response,
              409,
              responseError(
                "LEASE_LOST",
                "Another tab is editing this attempt.",
              ),
            );
          if (command.expectedRevision !== attempt.revision)
            return send(
              response,
              409,
              responseError(
                "REVISION_CONFLICT",
                "Progress changed. Reloading your saved work.",
                attempt.revision,
              ),
            );
          if (!activeLease(attempt)) {
            attempt.leaseEpoch += 1;
            attempt.writerTabId = command.tabId;
          }
          attempt.leaseExpiresAt = new Date(
            now().getTime() + leaseDurationMs,
          ).toISOString();
          const order = orderFor(attempt, state);
          const isTransfer =
            attempt.completed && Boolean(attempt.transferOrder);
          if (
            order.id !== match[2] ||
            (attempt.completed && !isTransfer) ||
            attempt.status === "paused"
          )
            return send(
              response,
              409,
              responseError("ORDER_NOT_ACTIVE", "That order is not active."),
            );
          const validation = validateRepresentation(
            order,
            body.representationA,
            body.representationB ?? null,
          );
          const responseFields = new Set([
            "commandId",
            "expectedRevision",
            "leaseEpoch",
            "tabId",
            "representationA",
            "representationB",
            "activeMs",
          ]);
          if (
            !validation.schemaValid ||
            Object.keys(body).some((key) => !responseFields.has(key)) ||
            (body.activeMs !== undefined &&
              (!isNonNegativeInteger(body.activeMs) ||
                body.activeMs > 86400000))
          )
            return send(
              response,
              422,
              responseError(
                "INVALID_INPUT",
                "Use six whole, nonnegative crate quantities and supported response fields.",
              ),
            );
          attempt.responses.push({
            commandId: command.commandId,
            activeMs: isNonNegativeInteger(body.activeMs)
              ? Math.min(body.activeMs, 86400000)
              : 0,
            order,
            representationA: body.representationA,
            representationB: body.representationB ?? null,
            validation,
            at: now().toISOString(),
          });
          if (validation.shipmentAccepted) {
            const responsesForOrder = attempt.responses.filter(
              (record) => record.order.id === order.id,
            );
            const facts = {
              firstObjectiveCorrect:
                responsesForOrder[0].validation.objectiveMet,
              wrongSubmissions: responsesForOrder
                .slice(0, -1)
                .filter((record) => !record.validation.objectiveMet).length,
              highestHint: highestHint(attempt, order.id),
              skipped: false,
            };
            attempt.evidence.push({
              orderId: order.id,
              skillId: order.primarySkill ?? "unknown",
              score: evidenceScore(facts),
              independentFirst: isIndependentFirst(facts),
              attemptId: attempt.id,
              signature: `${order.target}:${order.allowed.join(",")}:${order.mode ?? ""}`,
              committedAt: now().toISOString(),
            });
            if (isTransfer) {
              attempt.transferStar = true;
              attempt.transferOrder = undefined;
            } else {
              attempt.slot += 1;
              if (attempt.slot === 5) attempt.completed = true;
              else {
                attempt.activeOrder = issuedOrder(
                  attempt.id,
                  generatedForAttempt(
                    attempt,
                    state,
                    attempt.slot,
                    attempt.seed,
                    nextDifficulty(attempt, state),
                  ),
                  attempt.slot,
                  attempt.replacementIndex ?? 0,
                  attempt.seed,
                );
                retainIssuedOrder(
                  attempt,
                  attempt.activeOrder,
                  attempt.slot,
                  attempt.replacementIndex ?? 0,
                );
              }
            }
            attempt.awardedTier =
              awardCertifications(state, actor.id) ?? attempt.awardedTier;
          }
          attempt.revision += 1;
          const bodyOut = {
            commandId: command.commandId,
            committedAt: now().toISOString(),
            validation,
            snapshot: snapshot(attempt, state),
            ...(attempt.completed && !attempt.transferOrder
              ? { result: result(attempt, state.attempts.filter((item) => item.studentId === actor.id)) }
              : {}),
          };
          attempt.receipts.push({
            actorId: actor.id,
            commandId: command.commandId,
            payloadHash,
            status: 200,
            body: bodyOut,
          });
          await save(state);
          return send(response, 200, bodyOut);
        }
      }
      if (
        request.method === "GET" &&
        url.pathname === "/api/v1/teacher/classes" &&
        actor.role === "teacher"
      )
        return send(response, 200, {
          classes: directory()
            .classes.filter((item) => ownsClass(actor, item.id))
            .map((item) => ({
              ...item,
              studentCount: directory().students.filter(
                (student) => student.classId === item.id,
              ).length,
            })),
        });
      const teacherStudents = url.pathname.match(
        /^\/api\/v1\/teacher\/classes\/([^/]+)\/students$/,
      );
      if (
        teacherStudents &&
        request.method === "GET" &&
        actor.role === "teacher"
      ) {
        if (!ownsClass(actor, teacherStudents[1]))
          return send(
            response,
            404,
            responseError("NOT_FOUND", "Class not found."),
          );
        const state = await store();
        return send(response, 200, {
          students: directory()
            .students.filter(
              (student) => student.classId === teacherStudents[1],
            )
            .map(({ id, alias, username }) => ({
              id,
              alias,
              username,
              enabled: state.studentAccess?.[id] !== false,
            })),
          nextCursor: null,
        });
      }
      const studentAccess = url.pathname.match(
        /^\/api\/v1\/teacher\/students\/([^/]+)\/access$/,
      );
      if (
        studentAccess &&
        request.method === "PATCH" &&
        actor.role === "teacher"
      ) {
        const body = await json(request);
        const student = directory().students.find(
          (item) => item.id === studentAccess[1],
        );
        if (
          !student ||
          !ownsClass(actor, student.classId) ||
          typeof body.enabled !== "boolean" ||
          typeof body.commandId !== "string"
        )
          return send(
            response,
            404,
            responseError("NOT_FOUND", "Student not found."),
          );
        const state = await store();
        state.studentAccess ??= {};
        state.studentAccess[student.id] = body.enabled;
        await save(state);
        return send(response, 200, {
          student: {
            id: student.id,
            alias: student.alias,
            enabled: body.enabled,
          },
        });
      }
      const teacherEvidence = url.pathname.match(
        /^\/api\/v1\/teacher\/orders\/([^/]+)\/evidence$/,
      );
      if (
        teacherEvidence &&
        request.method === "GET" &&
        actor.role === "teacher"
      ) {
        const state = await store();
        const attempt = state.attempts.find((item) =>
          item.responses.some(
            (response) => response.order.id === teacherEvidence[1],
          ),
        );
        const responses = attempt?.responses.filter(
          (response) => response.order.id === teacherEvidence[1],
        );
        if (
          !attempt ||
          !responses?.length ||
          !ownsClass(actor, classForStudent(attempt.studentId) ?? "")
        )
          return send(
            response,
            404,
            responseError("NOT_FOUND", "Order evidence not found."),
          );
        const order = responses[0].order;
        return send(response, 200, {
          order,
          firstResponse: responses[0],
          finalResponse: responses.at(-1),
          supports: attempt.supportEvents.filter(
            (event) => event.orderId === order.id,
          ),
          evidence:
            attempt.evidence.find((item) =>
              item.orderId
                ? item.orderId === order.id
                : item.signature ===
                  `${order.target}:${order.allowed.join(",")}:${order.mode ?? ""}`,
            ) ?? null,
        });
      }
      const classReport = url.pathname.match(
        /^\/api\/v1\/teacher\/classes\/([^/]+)\/games\/place-value-factory\/report$/,
      );
      const studentReport = url.pathname.match(
        /^\/api\/v1\/teacher\/students\/([^/]+)\/games\/place-value-factory\/report$/,
      );
      if ((classReport || studentReport) && request.method === "GET" && actor.role === "teacher") {
        const directoryState = directory();
        const selectedStudent = studentReport
          ? directoryState.students.find((item) => item.id === studentReport[1])
          : null;
        const classId = classReport?.[1] ?? selectedStudent?.classId;
        const classroom = directoryState.classes.find((item) => item.id === classId);
        if (!classId || !classroom || !ownsClass(actor, classId) || (studentReport && !selectedStudent))
          return send(response, 404, responseError("NOT_FOUND", "Report not found."));
        const reportNow = now();
        let window: { from: Date; to: Date };
        try {
          window = reportWindow(url.searchParams, classroom.timezone, reportNow);
        } catch {
          return send(response, 422, responseError("INVALID_INPUT", "Use an increasing ISO date range."));
        }
        const transferParam = url.searchParams.get("includeTransfer");
        if (transferParam !== null && transferParam !== "true" && transferParam !== "false")
          return send(response, 422, responseError("INVALID_INPUT", "Invalid transfer filter."));
        const includeTransfer = transferParam === "true";
        const limitValue = Number(url.searchParams.get("limit") ?? 100);
        const cursor = url.searchParams.get("cursor");
        if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100 ||
            (cursor !== null && !directoryState.students.some((item) => item.id === cursor && item.classId === classId)))
          return send(response, 422, responseError("INVALID_INPUT", "Invalid report pagination."));
        const state = await store();
        const roster = (selectedStudent ? [selectedStudent] : directoryState.students.filter((item) => item.classId === classId))
          .sort((a, b) => a.id.localeCompare(b.id));
        const page = cursor ? roster.filter((item) => item.id > cursor) : roster;
        const students = page.slice(0, limitValue).map((student) => {
          const attempts = state.attempts.filter((attempt) => attempt.studentId === student.id);
          const completed = completedPathLevels(attempts);
          const highest = Math.max(0, ...[...completed].map((id) => Number(id.slice(6))));
          const nextLevel = Math.min(30, highest + 1);
          const nextStage = levelById(`level-${nextLevel}`)?.stage ?? 6;
          const evidence = attempts.flatMap((attempt) => attempt.evidence);
          return buildStudentReport({
            student,
            attempts,
            ...window,
            now: reportNow,
            includeTransfer,
            currentLevelId: `level-${nextLevel}`,
            achievedTier: tierFor(state, student.id),
            certifications: state.certifications?.[student.id] ?? [],
            primaryPracticeSkillId: nextPracticeSkill(STAGE_GATE_SKILLS[nextStage] ?? [], evidence, reportNow),
          });
        });
        const common = {
          timezone: classroom.timezone,
          from: window.from.toISOString(),
          to: window.to.toISOString(),
          asOf: reportNow.toISOString(),
        };
        if (studentReport) return send(response, 200, { ...common, ...students[0] });
        return send(response, 200, {
          classId,
          ...common,
          students,
          nextCursor: page.length > limitValue ? students.at(-1)?.studentId ?? null : null,
        });
      }
      return send(
        response,
        404,
        responseError("NOT_FOUND", "Route not found."),
      );
    } catch (error) {
      if (error instanceof AccessError)
        return send(
          response,
          error.status,
          responseError(error.code, error.message),
        );
      if (
        sqlStore &&
        !(error instanceof SyntaxError) &&
        !["INVALID_INPUT", "BODY_TOO_LARGE"].includes((error as Error).message)
      )
        throw error;
      return send(
        response,
        422,
        responseError("INVALID_INPUT", "Request could not be processed."),
      );
    }
  };
  return createServer(async (request, response) => {
    if (!sqlStore) return handle(request, response);
    pendingReplies.set(response, null);
    try {
      await sqlStore.transaction(async () =>
        identity
          ? directories.run(await identity.directory(), () =>
              handle(request, response),
            )
          : handle(request, response),
      );
      const reply = pendingReplies.get(response);
      pendingReplies.delete(response);
      if (!reply) throw new Error("Missing response");
      send(response, reply.status, reply.body, reply.extraHeaders);
    } catch {
      pendingReplies.delete(response);
      send(
        response,
        503,
        responseError(
          "STORAGE_UNAVAILABLE",
          "Your work could not be saved. Please try again.",
        ),
      );
    }
  });
}

function hydrateAttempt(attempt: Partial<Attempt>): Attempt {
  return {
    ...attempt,
    revision: attempt.revision ?? 0,
    leaseEpoch: attempt.leaseEpoch ?? 1,
    writerTabId: attempt.writerTabId ?? "legacy-tab",
    leaseExpiresAt: attempt.leaseExpiresAt ?? new Date(0).toISOString(),
    receipts: attempt.receipts ?? [],
    evidence: attempt.evidence ?? [],
    supportEvents: attempt.supportEvents ?? [],
  } as Attempt;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  createApiServer(
    defaultDataPath,
    process.env.DATABASE_URL
      ? {
          database: new Pool({ connectionString: process.env.DATABASE_URL }),
          ...(process.env.PVF_AUTH === "local"
            ? {
                identity: {
                  origin: process.env.PVF_ORIGIN ?? "",
                  receiptKey: process.env.PVF_RECEIPT_KEY ?? "",
                },
              }
            : {}),
        }
      : {},
  ).listen(port, "127.0.0.1", () =>
    console.log(
      `Place Value Factory API listening on http://localhost:${port}`,
    ),
  );
