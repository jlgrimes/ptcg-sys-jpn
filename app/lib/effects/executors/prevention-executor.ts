/**
 * Prevention executor - prevents damage or effects
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, PreventionEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { resolveTarget } from './utils/target-resolver';

/**
 * Execute a prevention effect
 * Note: Prevention effects typically set flags that other executors check
 * For now, this creates a log message - full implementation would require
 * adding prevention tracking to GameState
 */
export async function executePrevention(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const preventionEffect = effect as PreventionEffect;
  const preventType = preventionEffect.preventType || 'damage';
  const duration = preventionEffect.duration || 'next-attack';
  const reduction = preventionEffect.reduction;

  // Determine target (usually self active)
  const target = preventionEffect.targets?.[0] || {
    type: 'pokemon' as const,
    player: preventionEffect.target || 'self',
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);

  if (resolved.pokemon.length === 0) {
    return { state, messages: [] };
  }

  const pokemon = resolved.pokemon[0];

  // In a full implementation, we would add a "preventions" array to GameState
  // or PokemonState that tracks active prevention effects
  // For now, just log the effect

  let message: string;
  if (reduction) {
    message = `${pokemon.card.name} will take ${reduction} less damage from the next attack`;
  } else if (preventType === 'all') {
    message = `${pokemon.card.name} is protected from all damage and effects`;
  } else if (preventType === 'effects') {
    message = `${pokemon.card.name} is protected from effects`;
  } else {
    message = `${pokemon.card.name} is protected from damage`;
  }

  const messages: ExecutionMessage[] = [{
    type: 'info',
    message,
    data: {
      pokemon: pokemon.card.name,
      preventType,
      duration,
      reduction,
      player: resolved.player,
    },
  }];

  // TODO: Actually store prevention state
  // This would require extending GameState with prevention tracking

  return { state, messages };
}

export const preventionExecutor = {
  effectType: EffectType.Prevention,
  execute: executePrevention,
};
