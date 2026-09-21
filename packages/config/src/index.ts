import type { Denomination } from "../../contracts/src/index.js";

export type DifficultyBand = "easy" | "medium" | "hard";
export type StageOneSlot = {
  place: Denomination;
  skillId: string;
  defaultBand: DifficultyBand;
};

/** Level 1 preserves its required five-place coverage while varying only digit size. */
export const LEVEL_ONE_SLOTS: readonly StageOneSlot[] = [
  { place: 1, skillId: "pv.ones", defaultBand: "easy" },
  { place: 10, skillId: "pv.tens", defaultBand: "medium" },
  { place: 100, skillId: "pv.hundreds", defaultBand: "hard" },
  { place: 1, skillId: "pv.ones", defaultBand: "easy" },
  { place: 10, skillId: "pv.tens", defaultBand: "medium" },
];

export const DIGIT_RANGES: Record<DifficultyBand, readonly [number, number]> = {
  easy: [1, 3],
  medium: [4, 6],
  hard: [7, 9],
};

export const STAGE_GATE_SKILLS: Readonly<Record<number, readonly string[]>> = {
  1: [
    "pv.ones",
    "pv.tens",
    "pv.hundreds",
    "pv.thousands",
    "pv.tenThousands",
    "pv.hundredThousands",
  ],
  2: ["standard.decompose", "standard.zero"],
  3: [
    "rename.100000_10000",
    "rename.10000_1000",
    "rename.1000_100",
    "rename.100_10",
    "rename.10_1",
    "rename.multi",
  ],
  4: ["compose.allowed"],
  5: ["compose.forbidden"],
  6: ["reason.minimum", "reason.exactTypes", "reason.multiple"],
};

export type LevelMode =
  | "standard"
  | "single"
  | "restricted"
  | "forbidden"
  | "minimum"
  | "exactTypes"
  | "twoWays"
  | "repack";
export type LevelDefinition = {
  id: string;
  ordinal: number;
  title: string;
  zone: string;
  stage: number;
  mode: LevelMode;
  primarySkill: string;
  description: string;
};

const stage = (ordinal: number) =>
  ordinal <= 4
    ? 1
    : ordinal <= 9
      ? 2
      : ordinal <= 15
        ? 3
        : ordinal <= 18
          ? 4
          : ordinal <= 21
            ? 5
            : 6;
const zone = (value: number) =>
  value <= 4
    ? "Receiving"
    : value <= 9
      ? "Packing"
      : value <= 15
        ? "Warehouse"
        : value <= 21
          ? "Shipping"
          : "Lab";
const mode = (value: number): LevelMode =>
  value <= 9
    ? "standard"
    : value <= 15
      ? "single"
      : value <= 18
        ? "restricted"
        : value <= 20
          ? "forbidden"
          : value === 21
            ? "repack"
            : value <= 23
              ? "minimum"
              : value <= 25
                ? "exactTypes"
                : value <= 27
                  ? "twoWays"
                  : value === 28
                    ? "repack"
                    : value === 29
                      ? "minimum"
                      : "twoWays";
const skill = (value: number) =>
  value <= 4
    ? "pv.ones"
    : value <= 7
      ? "standard.decompose"
      : value <= 9
        ? "standard.zero"
        : value <= 14
          ? `rename.${["100000_10000", "10000_1000", "1000_100", "100_10", "10_1"][value - 10]}`
          : value === 15
            ? "rename.multi"
            : value <= 18
              ? "compose.allowed"
              : value <= 21
                ? "compose.forbidden"
                : value <= 23 || value === 28 || value === 29
                  ? "reason.minimum"
                  : value <= 25
                    ? "reason.exactTypes"
                    : "reason.multiple";
const labels = [
  "First Shipments",
  "Tall Crates",
  "Mixed Machines",
  "Receiving Review",
  "Two Digits",
  "Three Digits",
  "Full Number Builds",
  "Zero Detectives",
  "Zero Review",
  "Hundred-Thousands Exchange",
  "Ten-Thousands Exchange",
  "Thousands Exchange",
  "Hundreds Exchange",
  "Tens Exchange",
  "Multi-Step Exchange",
  "Small Allowed Sets",
  "Mixed Allowed Sets",
  "Shipping Challenge",
  "One Closed Machine",
  "Two Closed Machines",
  "Repacking Bay",
  "Fewest Crates",
  "Fewest with Gaps",
  "Two Crate Types",
  "Three Crate Types",
  "Two Ways",
  "Two Ways with Gaps",
  "Repack Efficiently",
  "Mixed Lab",
  "Factory Master Review",
];

export const LEVELS: readonly LevelDefinition[] = Array.from(
  { length: 30 },
  (_, index) => {
    const ordinal = index + 1;
    return {
      id: `level-${ordinal}`,
      ordinal,
      title: labels[index],
      zone: zone(ordinal),
      stage: stage(ordinal),
      mode: mode(ordinal),
      primarySkill: skill(ordinal),
      description: `Stage ${stage(ordinal)} ${mode(ordinal)} practice`,
    };
  },
);

export function levelById(id: string): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id);
}

/** The six stage-one skills use the published names, never denomination numbers. */
export function placeValueSkill(place: Denomination): string {
  return (
    {
      1: "pv.ones",
      10: "pv.tens",
      100: "pv.hundreds",
      1000: "pv.thousands",
      10000: "pv.tenThousands",
      100000: "pv.hundredThousands",
    } as Record<number, string>
  )[place];
}
