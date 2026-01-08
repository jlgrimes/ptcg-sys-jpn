/**
 * Shuffle executor - shuffles deck
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { shuffleDeck } from './utils/state-helpers';

/**
 * Execute a shuffle effect
 */
export async function executeShuffle(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  // Determine whose deck to shuffle
  const player = effect.target || 'self';

  let newState = state;

  if (player === 'self' || player === 'both') {
    newState = shuffleDeck(newState);
  }

  // Note: We can't shuffle opponent's deck in the current state model
  // (we don't have access to their deck contents)

  const messages: ExecutionMessage[] = [{
    type: 'info',
    message: player === 'both' ? 'Both players shuffled their decks' : 'Shuffled deck',
    data: { player },
  }];

  return { state: newState, messages };
}

export const shuffleExecutor = {
  effectType: EffectType.Shuffle,
  execute: executeShuffle,
};
