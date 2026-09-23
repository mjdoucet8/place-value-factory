import type { SelectedLevel } from "./models.js";
import { LEVELS } from "../../../packages/config/src/index.js";

const baseOrder = {
  id: "fixture-order",
  target: 420000,
  allowed: [100000, 10000, 1000, 100, 10, 1],
  canonicalRequired: false,
  minimumRequired: false,
  exactTypes: null,
  distinctRepresentations: 1,
  difficultyBand: "medium",
  primarySkill: "compose.allowed",
  mode: "standard",
  sourceRepresentation: null,
};
const baseAttempt = {
  attemptId: "fixture-attempt",
  revision: 2,
  leaseEpoch: 1,
  leaseExpiresAt: "2026-09-22T18:00:00.000Z",
  writerTabId: "fixture-tab",
  status: "active",
  levelId: "level-18",
  kind: "path",
  configVersion: "v1-local",
  shippedSlots: 2,
  skippedOrders: 0,
  correctedSlots: 0,
  currentHintStep: "none",
  acknowledgedCommandIds: [],
  achievedTier: "Operator",
  activeOrder: baseOrder,
};

export const GAME_FIXTURES: Record<
  string,
  {
    label: string;
    attempt: any;
    notice?: string;
    saving?: boolean;
    storageUnavailable?: boolean;
    helpOpen?: boolean;
    pressure?: "calm" | "busy";
  }
> = {
  calm: { label: "Calm ordinary play", attempt: baseAttempt, pressure: "calm" },
  busy: { label: "Busy cosmetic play", attempt: baseAttempt, pressure: "busy" },
  restricted: {
    label: "Restricted machines",
    attempt: {
      ...baseAttempt,
      levelId: "level-18",
      activeOrder: {
        ...baseOrder,
        allowed: [1000, 10],
        target: 420000,
        mode: "restricted",
      },
    },
  },
  minimum: {
    label: "Minimum crates",
    attempt: {
      ...baseAttempt,
      levelId: "level-22",
      activeOrder: {
        ...baseOrder,
        target: 346,
        minimumRequired: true,
        mode: "minimum",
      },
    },
  },
  exactTypes: {
    label: "Exactly two crate types",
    attempt: {
      ...baseAttempt,
      levelId: "level-24",
      activeOrder: {
        ...baseOrder,
        target: 42,
        exactTypes: 2,
        mode: "exactTypes",
      },
    },
  },
  twoWays: {
    label: "Two representations",
    attempt: {
      ...baseAttempt,
      levelId: "level-26",
      activeOrder: {
        ...baseOrder,
        target: 400,
        distinctRepresentations: 2,
        mode: "twoWays",
      },
    },
  },
  repack: {
    label: "Repacking source",
    attempt: {
      ...baseAttempt,
      levelId: "level-28",
      activeOrder: {
        ...baseOrder,
        target: 346,
        allowed: [1000, 100, 1],
        minimumRequired: true,
        mode: "repack",
        sourceRepresentation: [0, 0, 0, 3, 4, 6],
      },
    },
  },
  incorrect: {
    label: "Incorrect feedback",
    attempt: baseAttempt,
    notice: "You need more crates.",
  },
  correct: {
    label: "Saved correct feedback",
    attempt: baseAttempt,
    notice: "Saved — shipment accepted.",
  },
  pending: {
    label: "Saving and pending",
    attempt: baseAttempt,
    notice: "Saving your shipment…",
    saving: true,
  },
  offline: {
    label: "Offline pending recovery",
    attempt: baseAttempt,
    notice: "Saved shipment is waiting for a connection.",
  },
  storage: {
    label: "Storage unavailable",
    attempt: baseAttempt,
    storageUnavailable: true,
  },
  takeover: {
    label: "Two-tab takeover",
    attempt: { ...baseAttempt, writerTabId: "another-tab" },
  },
  paused: {
    label: "Paused mission",
    attempt: { ...baseAttempt, status: "paused" },
  },
  help: { label: "Help dialog", attempt: baseAttempt, helpOpen: true },
};

export const MAP_FIXTURE = {
  profileRevision: 11,
  highestUnlockedLevelId: "level-12",
  lastCompletedEfficiency: 88,
  achievedTier: "Converter",
  certifications: ["Operator", "Converter"],
  zones: [...new Set(LEVELS.map((level) => level.zone))].map((name) => ({
    id: name.toLowerCase(),
    name,
    levels: LEVELS.filter((level) => level.zone === name).map((level) => ({
      id: level.id,
      title: level.title,
      stage: level.stage,
      status:
        level.ordinal < 12
          ? "completed"
          : level.ordinal === 12
            ? "unlocked"
            : "locked",
      stars: level.ordinal < 12 ? (level.ordinal % 3 === 0 ? 2 : 3) : 0,
      prerequisiteSummary:
        level.ordinal <= 12
          ? "Ready to practice"
          : `Complete Level ${level.ordinal - 1} first`,
    })),
  })),
};

export const INTRO_FIXTURE: SelectedLevel = {
  id: "level-18",
  title: "Shipping Challenge",
  stage: 4,
  status: "unlocked",
  stars: 0,
  prerequisiteSummary: "Ready",
  zoneName: "Shipping",
};
export const PROGRESS_FIXTURE = {
  completedLevelIds: ["level-1", "level-2"],
  nextPracticeSkillId: "pv.hundreds",
  skills: [
    {
      skillId: "pv.ones",
      status: "secure",
      sampleN: 8,
      independentFirstN: 7,
      needsRefresh: false,
    },
    {
      skillId: "pv.hundreds",
      status: "developing",
      sampleN: 3,
      independentFirstN: 2,
      needsRefresh: false,
    },
    {
      skillId: "rename.1000_100",
      status: "unknown",
      sampleN: 0,
      independentFirstN: 0,
      needsRefresh: false,
    },
  ],
};
export const RESULTS_FIXTURES = {
  two: {
    shipped: 5,
    firstObjectiveCorrect: 4,
    eventuallyCorrect: 5,
    bestStreak: 3,
    efficiency: 94,
    bestLevelStars: 2,
    transferStar: false,
    newlyUnlockedLevelIds: ["level-19"],
    skillStatuses: [
      { skillId: "compose.allowed", status: "developing", sampleN: 5 },
    ],
  },
  three: {
    shipped: 5,
    firstObjectiveCorrect: 5,
    eventuallyCorrect: 5,
    bestStreak: 5,
    efficiency: 100,
    bestLevelStars: 3,
    transferStar: true,
    newlyUnlockedLevelIds: ["level-19"],
    skillStatuses: [
      { skillId: "compose.allowed", status: "secure", sampleN: 8 },
    ],
  },
};
