import { createHash, randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { difficultyFor, evidenceScore, generateLevelOrder, generatePracticeOrder, isIndependentFirst, nextPracticeSkill, stageGate, summarizeMastery, validateRepresentation, type EvidenceRecord } from '../../../packages/game-engine/src/index.js';
import { LEVELS, STAGE_GATE_SKILLS, levelById } from '../../../packages/config/src/index.js';

const port = Number(process.env.PORT ?? 3101);
const defaultDataPath = resolve(process.cwd(), 'db/local-development.json');
const leaseDurationMs = 60_000;

type Order = ReturnType<typeof generateLevelOrder>;
type ResponseRecord = { order: Order; representationA: unknown; representationB: unknown; validation: ReturnType<typeof validateRepresentation>; at: string };
type Receipt = { actorId: string; commandId: string; payloadHash: string; status: number; body: unknown };
type Attempt = {
  id: string; studentId: string; levelId: string; seed: number; slot: number; activeOrder?: Order;
  responses: ResponseRecord[]; completed: boolean; createdAt: string; revision: number; leaseEpoch: number;
  writerTabId: string; leaseExpiresAt: string; receipts: Receipt[]; evidence: EvidenceRecord[]; kind?: 'path' | 'practice'; practiceSkill?: string;
};
type Store = { attempts: Attempt[] };
type Actor = { id: string; role: 'student' | 'teacher' };
type Command = { commandId: string; expectedRevision: number; leaseEpoch: number; tabId: string };
const students = [{ id: 'student-ava', username: 'ava', pin: '123456', alias: 'Ava', classCode: 'FACTORY5' }];
const teachers = [{ id: 'teacher-dev', username: 'teacher', password: 'factory-demo' }];

function hashPayload(body: unknown) { return createHash('sha256').update(JSON.stringify(body)).digest('hex'); }
function isNonNegativeInteger(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 0; }
function commandFrom(body: unknown): Command | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  return typeof value.commandId === 'string' && value.commandId.length > 0 && isNonNegativeInteger(value.expectedRevision) && isNonNegativeInteger(value.leaseEpoch) && typeof value.tabId === 'string' && value.tabId.length > 0 ? value as unknown as Command : null;
}
function startCommandFrom(body: unknown): { commandId: string; profileRevision: number; tabId: string } | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  return typeof value.commandId === 'string' && value.commandId.length > 0 && isNonNegativeInteger(value.profileRevision) && typeof value.tabId === 'string' && value.tabId.length > 0 ? value as unknown as { commandId: string; profileRevision: number; tabId: string } : null;
}

export function createApiServer(dataPath = defaultDataPath): Server {
  async function store(): Promise<Store> {
    try { const parsed = JSON.parse(await readFile(dataPath, 'utf8')) as Store; return { attempts: parsed.attempts.map(hydrateAttempt) }; }
    catch { return { attempts: [] }; }
  }
  async function save(value: Store) { await mkdir(dirname(dataPath), { recursive: true }); await writeFile(dataPath, JSON.stringify(value, null, 2)); }
  function send(response: ServerResponse, status: number, body?: unknown) {
    response.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type,x-session,idempotency-key' });
    response.end(body === undefined ? undefined : JSON.stringify(body));
  }
  async function json(request: IncomingMessage): Promise<Record<string, unknown>> {
    let body = ''; for await (const chunk of request) { body += chunk; if (body.length > 32 * 1024) throw new Error('BODY_TOO_LARGE'); }
    const parsed: unknown = body ? JSON.parse(body) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('INVALID_INPUT');
    return parsed as Record<string, unknown>;
  }
  function principal(request: IncomingMessage): Actor | null {
    const value = request.headers['x-session'];
    if (value === 'student-ava') return { id: 'student-ava', role: 'student' };
    if (value === 'teacher-dev') return { id: 'teacher-dev', role: 'teacher' };
    return null;
  }
  function receiptFor(attempt: Attempt, actor: Actor, commandId: string, payloadHash: string): Receipt | null | 'conflict' {
    const receipt = attempt.receipts.find((item) => item.actorId === actor.id && item.commandId === commandId);
    if (!receipt) return null;
    return receipt.payloadHash === payloadHash ? receipt : 'conflict';
  }
  function matchingKey(request: IncomingMessage, command: { commandId: string }) { return request.headers['idempotency-key'] === command.commandId; }
  function activeLease(attempt: Attempt) { return Date.parse(attempt.leaseExpiresAt) > Date.now(); }
  function correctedSlots(attempt: Attempt) {
    const firstOrderResponse = new Map<string, ResponseRecord>();
    for (const record of attempt.responses) if (!firstOrderResponse.has(record.order.id)) firstOrderResponse.set(record.order.id, record);
    return [...firstOrderResponse.values()].filter((record) => !record.validation.shipmentAccepted).length;
  }
  function snapshot(attempt: Attempt) {
    return { attemptId: attempt.id, revision: attempt.revision, leaseEpoch: attempt.leaseEpoch, leaseExpiresAt: attempt.leaseExpiresAt, writerTabId: attempt.writerTabId, status: attempt.completed ? 'completed' : 'active', levelId: attempt.levelId, kind: attempt.kind ?? 'path', configVersion: 'v1-local', shippedSlots: attempt.slot, skippedOrders: 0, correctedSlots: correctedSlots(attempt), acknowledgedCommandIds: attempt.receipts.map((receipt) => receipt.commandId).slice(-20), achievedTier: 'Trainee', activeOrder: attempt.completed ? null : orderFor(attempt) };
  }
  function mapFor(attempts: Attempt[]) {
    const completed = new Set(attempts.filter((attempt) => attempt.completed).map((attempt) => attempt.levelId));
    const highest = Math.max(0, ...LEVELS.filter((level) => completed.has(level.id)).map((level) => level.ordinal));
    const evidence = attempts.flatMap((attempt) => attempt.evidence);
    const eligible = (level: typeof LEVELS[number]) => level.ordinal <= highest + 1 && (level.stage === 1 || level.ordinal !== LEVELS.find((item) => item.stage === level.stage)?.ordinal || stageGate(level.stage - 1, evidence).satisfied);
    const zones = [...new Set(LEVELS.map((level) => level.zone))].map((zone) => ({ id: zone.toLowerCase(), name: zone, levels: LEVELS.filter((level) => level.zone === zone).map((level) => ({ id: level.id, title: level.title, stage: level.stage, status: completed.has(level.id) ? 'completed' : eligible(level) ? 'unlocked' : 'locked', stars: completed.has(level.id) ? 2 : 0, prerequisiteSummary: eligible(level) ? 'Ready to practice' : level.ordinal <= highest + 1 ? `Practice required skills before Stage ${level.stage}` : `Complete Level ${level.ordinal - 1} first` })) }));
    return { configVersion: 'v1-local', zones, profileRevision: completed.size, highestUnlockedLevelId: `level-${Math.min(30, highest + 1)}` };
  }
  function responseError(code: string, message: string, currentRevision?: number) { return { error: { code, message, ...(currentRevision === undefined ? {} : { currentRevision }) } }; }
  function result(attempt: Attempt) {
    const firstPerOrder = new Map<string, ResponseRecord>();
    for (const record of attempt.responses) if (!firstPerOrder.has(record.order.id)) firstPerOrder.set(record.order.id, record);
    return { attemptId: attempt.id, completed: true, shipped: 5, submittedOrders: attempt.responses.length, firstObjectiveCorrect: [...firstPerOrder.values()].filter((item) => item.validation.objectiveMet).length, firstValueCorrect: [...firstPerOrder.values()].filter((item) => item.validation.valueMatches).length, eventuallyCorrect: 5, correctedSlots: correctedSlots(attempt), skippedOrders: 0, efficiency: Math.max(0, 100 - 6 * correctedSlots(attempt)), mainStars: 2, transferStar: false, bestLevelStars: 2, newlyUnlockedLevelIds: [`level-${Math.min(30, Number(attempt.levelId.slice(6)) + 1)}`], newlyEarnedTier: null, policyVersion: 'v1-local' };
  }
  function nextDifficulty(attempt: Attempt): 'easy' | 'medium' | 'hard' {
    const nextOrder = attempt.kind === 'practice' && attempt.practiceSkill ? generatePracticeOrder(attempt.practiceSkill, attempt.seed, attempt.slot, 'easy') : generateLevelOrder(attempt.levelId, attempt.seed, attempt.slot, 'easy');
    return difficultyFor(summarizeMastery(nextOrder.primarySkill ?? 'unknown', attempt.evidence).status);
  }
  function orderFor(attempt: Attempt) { return attempt.activeOrder ?? (attempt.kind === 'practice' && attempt.practiceSkill ? generatePracticeOrder(attempt.practiceSkill, attempt.seed, attempt.slot, nextDifficulty(attempt)) : generateLevelOrder(attempt.levelId, attempt.seed, attempt.slot, nextDifficulty(attempt))); }

  return createServer(async (request, response) => {
    try {
      if (request.method === 'OPTIONS') return send(response, 204);
      const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
      if (request.method === 'POST' && url.pathname === '/api/v1/auth/student/session') {
        const body = await json(request); const student = students.find((item) => item.classCode === String(body.classCode).trim().toUpperCase() && item.username === String(body.username).trim().toLowerCase() && item.pin === body.pin);
        return student ? send(response, 200, { principal: { id: student.id, role: 'student', classId: 'class-demo' }, csrfToken: 'local-dev' }) : send(response, 401, responseError('INVALID_CREDENTIALS', 'Those login details did not match.'));
      }
      if (request.method === 'POST' && url.pathname === '/api/v1/auth/teacher/session') {
        const body = await json(request); const teacher = teachers.find((item) => item.username === body.username && item.password === body.password);
        return teacher ? send(response, 200, { principal: { id: teacher.id, role: 'teacher' }, csrfToken: 'local-dev' }) : send(response, 401, responseError('INVALID_CREDENTIALS', 'Those login details did not match.'));
      }
      const actor = principal(request); if (!actor) return send(response, 401, responseError('SESSION_EXPIRED', 'Please sign in.'));
      if (request.method === 'GET' && url.pathname === '/api/v1/games/place-value-factory/map' && actor.role === 'student') return send(response, 200, mapFor((await store()).attempts.filter((attempt) => attempt.studentId === actor.id)));
      if (request.method === 'GET' && url.pathname === '/api/v1/games/place-value-factory/progress' && actor.role === 'student') {
        const attempts = (await store()).attempts.filter((attempt) => attempt.studentId === actor.id); const evidence = attempts.flatMap((attempt) => attempt.evidence);
        const skillIds = [...new Set(Object.values(STAGE_GATE_SKILLS).flat())].sort(); const highestCompleted = Math.max(0, ...attempts.filter((attempt) => attempt.completed).map((attempt) => Number(attempt.levelId.slice(6))));
        const nextLevel = LEVELS.find((level) => level.ordinal === highestCompleted + 1); const gateSkills = nextLevel && nextLevel.stage > 1 ? STAGE_GATE_SKILLS[nextLevel.stage - 1] : STAGE_GATE_SKILLS[1];
        return send(response, 200, { skills: skillIds.map((skillId) => summarizeMastery(skillId, evidence)), nextPracticeSkillId: nextPracticeSkill(gateSkills, evidence), completedLevelIds: attempts.filter((attempt) => attempt.completed).map((attempt) => attempt.levelId) });
      }
      if (request.method === 'POST' && url.pathname === '/api/v1/games/place-value-factory/attempts' && actor.role === 'student') {
        const body = await json(request); const command = startCommandFrom(body);
        if (!command || !matchingKey(request, command)) return send(response, 422, responseError('INVALID_INPUT', 'A command ID, profile revision, tab ID, and matching Idempotency-Key are required.'));
        const state = await store(); let attempt = state.attempts.find((item) => item.studentId === actor.id && !item.completed);
        const isPractice = body.kind === 'practice'; const requestedLevel = levelById(typeof body.levelId === 'string' ? body.levelId : 'level-1'); const completed = new Set(state.attempts.filter((item) => item.studentId === actor.id && item.completed).map((item) => item.levelId)); const highest = Math.max(0, ...LEVELS.filter((level) => completed.has(level.id)).map((level) => level.ordinal));
        const evidence = state.attempts.filter((item) => item.studentId === actor.id).flatMap((item) => item.evidence);
        const firstOfStage = requestedLevel && LEVELS.find((item) => item.stage === requestedLevel.stage)?.id === requestedLevel.id;
        if (!requestedLevel || (!isPractice && (requestedLevel.ordinal > highest + 1 || (firstOfStage && requestedLevel.stage > 1 && !stageGate(requestedLevel.stage - 1, evidence).satisfied)))) return send(response, 409, responseError('LEVEL_LOCKED', 'Complete the earlier level and practice the required skills first.'));
        if (command.profileRevision !== completed.size) return send(response, 409, responseError('REVISION_CONFLICT', 'Progress changed. Reloading your saved work.', completed.size));
        if (attempt) return send(response, 200, snapshot(attempt));
        const now = new Date(); const seed = 71 + requestedLevel.ordinal;
        const gateSkills = requestedLevel.stage > 1 ? STAGE_GATE_SKILLS[requestedLevel.stage - 1] : STAGE_GATE_SKILLS[1]; const practiceSkill = isPractice ? nextPracticeSkill(gateSkills, evidence) ?? gateSkills[0] : undefined;
        attempt = { id: randomUUID(), studentId: actor.id, levelId: requestedLevel.id, seed, slot: 0, activeOrder: isPractice && practiceSkill ? generatePracticeOrder(practiceSkill, seed, 0, 'easy') : generateLevelOrder(requestedLevel.id, seed, 0, 'easy'), responses: [], completed: false, createdAt: now.toISOString(), revision: 0, leaseEpoch: 1, writerTabId: command.tabId, leaseExpiresAt: new Date(now.getTime() + leaseDurationMs).toISOString(), receipts: [], evidence: [], kind: isPractice ? 'practice' : 'path', practiceSkill };
        state.attempts.push(attempt); await save(state); return send(response, 201, snapshot(attempt));
      }
      const heartbeat = url.pathname.match(/^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)\/lease\/heartbeat$/);
      if (heartbeat && request.method === 'POST' && actor.role === 'student') {
        const body = await json(request); const command = commandFrom(body); if (!command || !matchingKey(request, command)) return send(response, 422, responseError('INVALID_INPUT', 'A command and matching Idempotency-Key are required.'));
        const state = await store(); const attempt = state.attempts.find((item) => item.id === heartbeat[1] && item.studentId === actor.id); if (!attempt) return send(response, 404, responseError('NOT_FOUND', 'Attempt not found.'));
        const payloadHash = hashPayload(body); const prior = receiptFor(attempt, actor, command.commandId, payloadHash); if (prior === 'conflict') return send(response, 409, responseError('IDEMPOTENCY_CONFLICT', 'This command ID was used with a different request.')); if (prior) return send(response, prior.status, prior.body);
        if (command.expectedRevision !== attempt.revision) return send(response, 409, responseError('REVISION_CONFLICT', 'Progress changed. Reloading your saved work.', attempt.revision));
        if (command.leaseEpoch !== attempt.leaseEpoch || attempt.writerTabId !== command.tabId) return send(response, 409, responseError('LEASE_LOST', 'Another tab is editing this attempt.'));
        attempt.leaseExpiresAt = new Date(Date.now() + leaseDurationMs).toISOString(); const bodyOut = { commandId: command.commandId, leaseEpoch: attempt.leaseEpoch, leaseExpiresAt: attempt.leaseExpiresAt }; attempt.receipts.push({ actorId: actor.id, commandId: command.commandId, payloadHash, status: 200, body: bodyOut }); await save(state); return send(response, 200, bodyOut);
      }
      const match = url.pathname.match(/^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)(?:\/orders\/([^/]+)\/responses|\/results)?$/);
      if (match && actor.role === 'student') {
        const state = await store(); const attempt = state.attempts.find((item) => item.id === match[1] && item.studentId === actor.id); if (!attempt) return send(response, 404, responseError('NOT_FOUND', 'Attempt not found.'));
        if (request.method === 'GET' && url.pathname.endsWith('/results')) return attempt.completed ? send(response, 200, result(attempt)) : send(response, 409, responseError('NOT_COMPLETE', 'This attempt is not complete.'));
        if (request.method === 'GET') return send(response, 200, snapshot(attempt));
        if (request.method === 'POST' && match[2]) {
          const body = await json(request); const command = commandFrom(body);
          if (!command || !matchingKey(request, command)) return send(response, 422, responseError('INVALID_INPUT', 'A command and matching Idempotency-Key are required.'));
          const payloadHash = hashPayload(body); const existing = receiptFor(attempt, actor, command.commandId, payloadHash);
          if (existing === 'conflict') return send(response, 409, responseError('IDEMPOTENCY_CONFLICT', 'This command ID was used with a different request.'));
          if (existing) return send(response, existing.status, existing.body);
          if (command.expectedRevision !== attempt.revision) return send(response, 409, responseError('REVISION_CONFLICT', 'Progress changed. Reloading your saved work.', attempt.revision));
          if (command.leaseEpoch !== attempt.leaseEpoch || (activeLease(attempt) && command.tabId !== attempt.writerTabId)) return send(response, 409, responseError('LEASE_LOST', 'Another tab is editing this attempt.'));
          if (!activeLease(attempt)) { attempt.leaseEpoch += 1; attempt.writerTabId = command.tabId; }
          attempt.leaseExpiresAt = new Date(Date.now() + leaseDurationMs).toISOString();
          const order = orderFor(attempt); if (order.id !== match[2] || attempt.completed) return send(response, 409, responseError('ORDER_NOT_ACTIVE', 'That order is no longer active.'));
          const validation = validateRepresentation(order, body.representationA, body.representationB ?? null);
          attempt.responses.push({ order, representationA: body.representationA, representationB: body.representationB ?? null, validation, at: new Date().toISOString() });
          if (validation.shipmentAccepted) {
            const responsesForOrder = attempt.responses.filter((record) => record.order.id === order.id);
            const facts = { firstObjectiveCorrect: responsesForOrder[0].validation.objectiveMet, wrongSubmissions: responsesForOrder.slice(0, -1).filter((record) => !record.validation.objectiveMet).length, highestHint: 'none' as const, skipped: false };
            attempt.evidence.push({ skillId: order.primarySkill ?? 'unknown', score: evidenceScore(facts), independentFirst: isIndependentFirst(facts), attemptId: attempt.id, signature: `${order.target}:${order.allowed.join(',')}:${order.mode ?? ''}`, committedAt: new Date().toISOString() });
            attempt.slot += 1; if (attempt.slot === 5) attempt.completed = true; else attempt.activeOrder = attempt.kind === 'practice' && attempt.practiceSkill ? generatePracticeOrder(attempt.practiceSkill, attempt.seed, attempt.slot, nextDifficulty(attempt)) : generateLevelOrder(attempt.levelId, attempt.seed, attempt.slot, nextDifficulty(attempt));
          }
          attempt.revision += 1;
          const bodyOut = { commandId: command.commandId, committedAt: new Date().toISOString(), validation, snapshot: snapshot(attempt), ...(attempt.completed ? { result: result(attempt) } : {}) };
          attempt.receipts.push({ actorId: actor.id, commandId: command.commandId, payloadHash, status: 200, body: bodyOut });
          await save(state); return send(response, 200, bodyOut);
        }
      }
      if (request.method === 'GET' && url.pathname === '/api/v1/teacher/classes/class-demo/games/place-value-factory/report' && actor.role === 'teacher') {
        const state = await store(); const attempts = state.attempts.filter((item) => item.studentId === 'student-ava'); const responses = attempts.flatMap((item) => item.responses);
        return send(response, 200, { classId: 'class-demo', students: [{ studentId: 'student-ava', alias: 'Ava', currentLevelId: attempts.some((item) => item.completed) ? 'level-2' : 'level-1', submittedN: responses.length, eventuallyCorrectN: responses.filter((item) => item.validation.shipmentAccepted).length, evidence: responses.map((item) => ({ target: item.order.target, vector: item.representationA, accepted: item.validation.shipmentAccepted })) }] });
      }
      return send(response, 404, responseError('NOT_FOUND', 'Route not found.'));
    } catch { return send(response, 422, responseError('INVALID_INPUT', 'Request could not be processed.')); }
  });
}

function hydrateAttempt(attempt: Partial<Attempt>): Attempt {
  return { ...attempt, revision: attempt.revision ?? 0, leaseEpoch: attempt.leaseEpoch ?? 1, writerTabId: attempt.writerTabId ?? 'legacy-tab', leaseExpiresAt: attempt.leaseExpiresAt ?? new Date(0).toISOString(), receipts: attempt.receipts ?? [], evidence: attempt.evidence ?? [] } as Attempt;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) createApiServer().listen(port, () => console.log(`Place Value Factory API listening on http://localhost:${port}`));
