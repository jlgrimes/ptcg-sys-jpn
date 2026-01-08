/**
 * Copy executor - copies moves or abilities from other Pokemon
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, CopyEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';
import { resolveTarget } from './utils/target-resolver';

/**
 * Execute a copy effect
 * Note: This requires access to card data (moves) which isn't in the current state model
 * For now, this creates a placeholder response
 */
export async function executeCopy(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const copyEffect = effect as CopyEffect;
  const what = copyEffect.what || 'move';

  // Determine source Pokemon to copy from
  const target = copyEffect.targets?.[0] || {
    type: 'pokemon' as const,
    player: 'opponent' as const,
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);

  if (resolved.pokemon.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No Pokemon available to copy from',
        data: {},
      }],
    };
  }

  const sourcePokemon = resolved.pokemon[0];

  // In a full implementation, we would:
  // 1. Look up the source Pokemon's card data to get its moves
  // 2. Let the player choose which move to copy
  // 3. Execute that move's effects

  // For now, return a placeholder message
  const messages: ExecutionMessage[] = [{
    type: 'info',
    message: `Copy ${what} from ${sourcePokemon.card.name}`,
    data: {
      source: sourcePokemon.card.name,
      what,
      player: resolved.player,
    },
  }];

  // To fully implement this, we would need:
  // - Card database access to look up moves
  // - Move-to-effect conversion
  // - Execute the copied move's effects

  return { state, messages };
}

export const copyExecutor = {
  effectType: EffectType.Copy,
  execute: executeCopy,
};
