export type Screen =
  | "login"
  | "map"
  | "game"
  | "results"
  | "progress"
  | "teacher"
  | "settings"
  | "state-gallery";

export type Settings = {
  sound: boolean;
  reducedMotion: boolean;
  pressure: "calm" | "busy";
  textScale: "normal" | "large";
};

export type Place = {
  value: number;
  name: string;
  icon: string;
};

export const PLACES: readonly Place[] = [
  { value: 100000, name: "Hundred thousands", icon: "◆" },
  { value: 10000, name: "Ten thousands", icon: "●" },
  { value: 1000, name: "Thousands", icon: "▲" },
  { value: 100, name: "Hundreds", icon: "■" },
  { value: 10, name: "Tens", icon: "✦" },
  { value: 1, name: "Ones", icon: "●" },
];

export type LevelSummary = {
  id: string;
  title: string;
  stage: number;
  status: "locked" | "unlocked" | "completed";
  stars: number;
  prerequisiteSummary: string;
};

export type SelectedLevel = LevelSummary & { zoneName: string };
