/**
 * Restriction executor - applies restrictions on moves or abilities
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { resolveTarget } from './utils/target-resolver';

/**
 * Execute a restriction effect
 * Note: Full implementation would require tracking restrictions in GameState
 */
export async function executeRestriction(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const restriction = effect.restriction || 'cannot-use';
  const moveName = effect.moveName;
  const duration = effect.duration || 'next-turn';

  // Determine target
  const target = effect.targets?.[0] || {
    type: 'pokemon' as const,
    player: effect.target || 'self',
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);

  if (resolved.pokemon.length === 0) {
    return { state, messages: [] };
  }

  const pokemon = resolved.pokemon[0];

  let message: string;
  if (moveName) {
    message = `${pokemon.card.name} cannot use ${moveName} ${duration === 'next-turn' ? 'next turn' : 'until it leaves play'}`;
  } else {
    message = `${pokemon.card.name} has a restriction applied`;
  }

  const messages: ExecutionMessage[] = [{
    type: 'info',
    message,
    data: {
      pokemon: pokemon.card.name,
      restriction,
      moveName,
      duration,
      player: resolved.player,
    },
  }];

  // TODO: Store restriction state
  // This would require extending GameState with restriction tracking

  return { state, messages };
}

export const restrictionExecutor = {
  effectType: EffectType.Restriction,
  execute: executeRestriction,
};
