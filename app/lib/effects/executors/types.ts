/**
 * Types for the effect execution system
 */

import { GameState, CardInstance, PokemonState } from '../../notation/training-format';
import { Effect } from '../types';

/**
 * Seeded random number generator interface
 * Allows deterministic randomness for testing and replay
 */
export interface SeededRNG {
  /** Returns a random number between 0 and 1 */
  random(): number;
  /** Flip a coin: returns true for heads, false for tails */
  flipCoin(): boolean;
  /** Flip multiple coins: returns array of booleans (true = heads) */
  flipCoins(count: number): boolean[];
  /** Shuffle an array in place and return it */
  shuffle<T>(array: T[]): T[];
  /** Pick random elements from array */
  pickRandom<T>(array: T[], count: number): T[];
}

/**
 * Simple seeded RNG implementation using linear congruential generator
 */
export class SimpleSeededRNG implements SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  random(): number {
    // LCG parameters (same as glibc)
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  flipCoin(): boolean {
    return this.random() >= 0.5;
  }

  flipCoins(count: number): boolean[] {
    const results: boolean[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.flipCoin());
    }
    return results;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  pickRandom<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle([...array]);
    return shuffled.slice(0, Math.min(count, array.length));
  }
}

/**
 * Callback type for player choices
 * Returns the indices of selected items from the options array
 */
export type ChoiceCallback = (request: ChoiceRequest) => Promise<number[]>;

/**
 * Request for player input
 */
export interface ChoiceRequest {
  type: 'select-pokemon' | 'select-card' | 'select-energy' | 'select-option';
  player: 'self' | 'opponent';
  options: ChoiceOption[];
  minSelections: number;
  maxSelections: number;
  message: string;
  canCancel?: boolean;
}

/**
 * A single option in a choice request
 */
export interface ChoiceOption {
  id: string;
  label: string;
  data: CardInstance | PokemonState | Effect[] | unknown;
}

/**
 * Context passed to all executors
 * Contains callbacks and RNG, keeping executeEffect pure
 */
export interface ExecutionContext {
  rng: SeededRNG;
  chooseForSelf: ChoiceCallback;
  chooseForOpponent: ChoiceCallback;
}

/**
 * Result of effect execution
 */
export interface ExecutionResult {
  state: GameState;
  messages: ExecutionMessage[];
  /** For compound effects that trigger other effects */
  pendingEffects?: Effect[];
}

/**
 * Log entry for what happened during execution
 */
export interface ExecutionMessage {
  type: 'info' | 'damage' | 'heal' | 'status' | 'draw' | 'discard' | 'search' | 'switch' | 'energy' | 'knockout' | 'counter' | 'prize';
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Resolved target - actual Pokemon or cards that were matched
 */
export interface ResolvedTarget {
  pokemon: PokemonState[];
  cards: CardInstance[];
  location: 'hand' | 'deck' | 'discard' | 'bench' | 'active' | 'prize' | 'field';
  player: 'self' | 'opponent';
  /** Index in bench array if location is 'bench' */
  benchIndices?: number[];
}

/**
 * Auto-choice resolver for testing - always picks first available option
 */
export function createAutoChoiceCallback(): ChoiceCallback {
  return async (request: ChoiceRequest): Promise<number[]> => {
    const count = Math.min(request.minSelections, request.options.length);
    return Array.from({ length: count }, (_, i) => i);
  };
}

/**
 * Create a default execution context for testing
 */
export function createTestContext(seed: number = 12345): ExecutionContext {
  return {
    rng: new SimpleSeededRNG(seed),
    chooseForSelf: createAutoChoiceCallback(),
    chooseForOpponent: createAutoChoiceCallback(),
  };
}
