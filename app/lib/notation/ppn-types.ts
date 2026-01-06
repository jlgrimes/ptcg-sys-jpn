/**
 * PTCG Portable Notation (PPN) Types
 *
 * A chess PGN-like notation format for Pokemon TCG games.
 * Designed for:
 * - Human readability
 * - Machine parsing
 * - AI training data
 * - Game replay
 */

export interface PPNGame {
  metadata: PPNMetadata;
  setup: PPNSetup;
  turns: PPNTurn[];
}

export interface PPNMetadata {
  event?: string;
  date?: string;
  player1: string;
  player2: string;
  result?: PPNResult;
  seed: number;
  format?: string; // 'standard', 'expanded', 'unlimited'
  variant?: string;
}

export type PPNResult = '1-0' | '0-1' | '0.5-0.5' | '*'; // P1 win, P2 win, draw, ongoing

export interface PPNSetup {
  player1: PPNPlayerSetup;
  player2: PPNPlayerSetup;
  coinFlipWinner: 1 | 2;
  firstPlayer: 1 | 2;
}

export interface PPNPlayerSetup {
  active: string; // Pokemon name
  bench: string[]; // Pokemon names
  hand: number; // Card count (hidden)
  prizes: number;
  deck: number;
}

export interface PPNTurn {
  turnNumber: number;
  player: 1 | 2;
  actions: PPNAction[];
  endState?: PPNTurnEndState;
}

export interface PPNTurnEndState {
  player1Prizes: number;
  player2Prizes: number;
}

/**
 * All possible actions in PPN notation
 */
export type PPNAction =
  | PPNDrawAction
  | PPNAttachAction
  | PPNEvolveAction
  | PPNAttackAction
  | PPNAbilityAction
  | PPNPlayAction
  | PPNRetreatAction
  | PPNSwitchAction
  | PPNDamageAction
  | PPNHealAction
  | PPNStatusAction
  | PPNPrizeAction
  | PPNCoinAction
  | PPNChoiceAction
  | PPNKnockoutAction
  | PPNPassAction
  | PPNSearchAction
  | PPNDiscardAction
  | PPNShuffleAction;

export interface PPNBaseAction {
  type: string;
  player: 1 | 2;
  annotation?: string; // Optional comment
}

export interface PPNDrawAction extends PPNBaseAction {
  type: 'draw';
  count: number;
}

export interface PPNAttachAction extends PPNBaseAction {
  type: 'attach';
  energyType: string; // 'L' for Lightning, 'F' for Fire, etc.
  target: string; // Pokemon name
}

export interface PPNEvolveAction extends PPNBaseAction {
  type: 'evolve';
  from: string;
  to: string;
}

export interface PPNAttackAction extends PPNBaseAction {
  type: 'attack';
  moveName: string;
  target?: string; // Target Pokemon (if not default)
}

export interface PPNAbilityAction extends PPNBaseAction {
  type: 'ability';
  abilityName: string;
  source: string; // Pokemon using the ability
}

export interface PPNPlayAction extends PPNBaseAction {
  type: 'play';
  cardName: string;
  cardType: 'supporter' | 'item' | 'stadium' | 'tool';
  target?: string;
}

export interface PPNRetreatAction extends PPNBaseAction {
  type: 'retreat';
  from: string;
  to: string;
  energyDiscarded?: string[]; // Energy types discarded
}

export interface PPNSwitchAction extends PPNBaseAction {
  type: 'switch';
  from: string;
  to: string;
  forced: boolean; // Was this forced by an effect?
}

export interface PPNDamageAction extends PPNBaseAction {
  type: 'damage';
  amount: number;
  target: string;
  source?: string;
}

export interface PPNHealAction extends PPNBaseAction {
  type: 'heal';
  amount: number;
  target: string;
}

export interface PPNStatusAction extends PPNBaseAction {
  type: 'status';
  status: 'paralyzed' | 'asleep' | 'confused' | 'burned' | 'poisoned';
  target: string;
  removed?: boolean; // True if status was removed
}

export interface PPNPrizeAction extends PPNBaseAction {
  type: 'prize';
  count: number;
}

export interface PPNCoinAction extends PPNBaseAction {
  type: 'coin';
  result: 'H' | 'T'; // Heads or Tails
  count?: number;
  results?: ('H' | 'T')[];
}

export interface PPNChoiceAction extends PPNBaseAction {
  type: 'choice';
  options: string[];
  selected: string;
}

export interface PPNKnockoutAction extends PPNBaseAction {
  type: 'knockout';
  pokemon: string;
}

export interface PPNPassAction extends PPNBaseAction {
  type: 'pass';
}

export interface PPNSearchAction extends PPNBaseAction {
  type: 'search';
  source: 'deck' | 'discard' | 'prizes';
  found: string[]; // Card names found
}

export interface PPNDiscardAction extends PPNBaseAction {
  type: 'discard';
  cards: string[];
  from: 'hand' | 'field' | 'deck';
}

export interface PPNShuffleAction extends PPNBaseAction {
  type: 'shuffle';
  what: 'deck' | 'hand-into-deck';
}

/**
 * Energy type abbreviations for notation
 */
export const ENERGY_ABBREV: Record<string, string> = {
  grass: 'G',
  fire: 'R', // Red
  water: 'W',
  lightning: 'L',
  psychic: 'P',
  fighting: 'F',
  darkness: 'D',
  metal: 'M',
  fairy: 'Y',
  dragon: 'N',
  colorless: 'C',
  normal: 'C',
};

/**
 * Reverse mapping for parsing
 */
export const ABBREV_ENERGY: Record<string, string> = Object.fromEntries(
  Object.entries(ENERGY_ABBREV).map(([k, v]) => [v, k])
);
