export const DENOMINATIONS = [100000, 10000, 1000, 100, 10, 1] as const;
export type Denomination = (typeof DENOMINATIONS)[number];
export type Representation = readonly [number, number, number, number, number, number];
export type FeedbackCode = 'SHIPMENT_CORRECT' | 'UNDERPRODUCTION' | 'OVERPRODUCTION' |
  'MACHINE_UNAVAILABLE' | 'STANDARD_REQUIRED' | 'TYPE_COUNT' | 'SAME_REPRESENTATION' |
  'CAN_REPACK' | 'INVALID_INPUT';
export type DifficultyBand = 'easy' | 'medium' | 'hard';

export interface OrderSpec {
  id: string;
  target: number;
  allowed: readonly Denomination[];
  canonicalRequired: boolean;
  minimumRequired: boolean;
  exactTypes: 2 | 3 | null;
  distinctRepresentations: 1 | 2;
  difficultyBand?: DifficultyBand;
  primarySkill?: string;
  mode?: string;
}

export interface Validation {
  schemaValid: boolean;
  valueMatches: boolean;
  restrictionsMet: boolean;
  objectiveMet: boolean;
  shipmentAccepted: boolean;
  representedTotals: number[];
  crateCounts: number[];
  minimumCrates: number | null;
  feedbackCode: FeedbackCode;
}
