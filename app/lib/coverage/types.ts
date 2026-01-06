import { Effect } from '../effects/types';

export interface CardCorpusEntry {
  id: string;
  name: string;
  hp?: string;
  type?: string;
  set?: string;
  effects: EffectText[];
  scrapedAt: string;
}

export interface EffectText {
  source: 'ability' | 'move' | 'card-effect';
  name?: string; // Ability or move name
  text: string;
  damage?: string; // For moves
}

export interface CoverageResult {
  cardId: string;
  cardName: string;
  effectSource: 'ability' | 'move' | 'card-effect';
  effectName?: string;
  effectText: string;
  parsedEffects: Effect[];
  parseSuccess: boolean;
  parserUsed: string | null;
  parseTimeMs: number;
}

export interface CoverageReport {
  generatedAt: string;
  totalCards: number;
  totalEffects: number;
  parsedSuccessfully: number;
  failedToParse: number;
  coveragePercentage: number;
  bySet: Record<string, SetCoverage>;
  unparsedPatterns: PatternFrequency[];
  parserUsage: Record<string, number>;
}

export interface SetCoverage {
  setName: string;
  totalEffects: number;
  parsed: number;
  failed: number;
  percentage: number;
}

export interface PatternFrequency {
  pattern: string;
  count: number;
  examples: string[];
}

export interface CorpusStats {
  totalCards: number;
  totalEffects: number;
  bySet: Record<string, number>;
  lastUpdated: string;
}
