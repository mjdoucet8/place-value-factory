import type { CSSProperties } from "react";

// Artwork and live controls share one coordinate system and scale together.
// Positions match the owner's approved map, including the two road bends.
export const FACTORY_MAP_SIZE = { width: 1747, height: 900 } as const;
const LEVEL_POSITIONS: readonly (readonly [number, number])[] = [
  [148, 272],
  [212, 272],
  [276, 272],
  [340, 272],
  [707, 275],
  [771, 275],
  [837, 275],
  [902, 275],
  [966, 275],
  [1313, 280],
  [1378, 280],
  [1443, 280],
  [1508, 280],
  [1574, 280],
  [1660, 358],
  [1252, 714],
  [1320, 714],
  [1388, 714],
  [1466, 714],
  [1548, 704],
  [1337, 797],
  [202, 704],
  [276, 708],
  [344, 713],
  [414, 716],
  [482, 718],
  [550, 718],
  [618, 718],
  [686, 718],
  [754, 718],
];
const STATION_POSITIONS: Record<string, readonly [number, number]> = {
  receiving: [257, 217],
  packing: [833, 217],
  warehouse: [1437, 217],
  shipping: [1305, 656],
  lab: [530, 656],
};
const position = ([left, top]: readonly [number, number]): CSSProperties => ({
  left,
  top,
});
export const levelPosition = (levelId: string): CSSProperties =>
  position(LEVEL_POSITIONS[Number(levelId.replace("level-", "")) - 1]);
export const stationPosition = (zone: string): CSSProperties =>
  position(STATION_POSITIONS[zone]);
