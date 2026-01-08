/**
 * Reveal executor - reveals cards to players
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, RevealEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { resolveTarget } from './utils/target-resolver';

/**
 * Execute a reveal effect
 */
export async function executeReveal(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const revealEffect = effect as RevealEffect;
  const revealTo = revealEffect.revealTo || 'both';

  // Determine what to reveal
  const target = revealEffect.targets?.[0] || {
    type: 'card' as const,
    player: 'self' as const,
    location: { type: 'hand' as const },
  };

  const resolved = resolveTarget(state, target);

  if (resolved.cards.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No cards to reveal',
        data: {},
      }],
    };
  }

  const cardNames = resolved.cards.map(c => c.name);

  let revealMessage: string;
  switch (revealTo) {
    case 'self':
      revealMessage = `Revealed to yourself: ${cardNames.join(', ')}`;
      break;
    case 'opponent':
      revealMessage = `Revealed to opponent: ${cardNames.join(', ')}`;
      break;
    case 'both':
    default:
      revealMessage = `Revealed: ${cardNames.join(', ')}`;
      break;
  }

  const messages: ExecutionMessage[] = [{
    type: 'info',
    message: revealMessage,
    data: {
      cards: cardNames,
      revealTo,
      from: resolved.location,
    },
  }];

  return { state, messages };
}

export const revealExecutor = {
  effectType: EffectType.Reveal,
  execute: executeReveal,
};
