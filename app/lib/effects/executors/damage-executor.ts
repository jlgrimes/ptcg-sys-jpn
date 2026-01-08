/**
 * Damage executor - applies damage to Pokemon
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, DamageEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { resolveTarget } from './utils/target-resolver';
import {
  updateActive,
  updateBench,
  updatePokemonDamage,
  knockoutPokemon,
  takePrize,
} from './utils/state-helpers';

/**
 * Execute a damage effect
 */
export async function executeDamage(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const damageEffect = effect as DamageEffect;
  const damage = damageEffect.value;

  if (!damage || damage <= 0) {
    return { state, messages: [] };
  }

  // Determine target - use targets array or simple target
  const target = damageEffect.targets?.[0] || {
    type: 'pokemon' as const,
    player: damageEffect.target || 'opponent',
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);

  if (resolved.pokemon.length === 0) {
    return { state, messages: [] };
  }

  let newState = state;
  const messages: ExecutionMessage[] = [];
  const pendingEffects: Effect[] = [];

  for (let i = 0; i < resolved.pokemon.length; i++) {
    const pokemon = resolved.pokemon[i];
    const newDamage = pokemon.damage + damage;
    const isKnockout = newDamage >= pokemon.maxHp;

    if (isKnockout) {
      // Handle knockout
      const location = resolved.location === 'active' ? 'active' : 'bench';
      const benchIndex = resolved.benchIndices?.[i];

      const [stateAfterKO, discardedCards] = knockoutPokemon(
        newState,
        resolved.player,
        location as 'active' | 'bench',
        benchIndex
      );
      newState = stateAfterKO;

      // Opponent takes a prize when our Pokemon is knocked out
      // (or we take a prize when opponent's Pokemon is knocked out)
      const prizeTaker = resolved.player === 'self' ? 'opponent' : 'self';
      newState = takePrize(newState, prizeTaker, 1);

      messages.push({
        type: 'knockout',
        message: `${pokemon.card.name} was knocked out!`,
        data: {
          pokemon: pokemon.card.name,
          damage,
          player: resolved.player,
        },
      });
    } else {
      // Apply damage
      const location = resolved.location === 'active' ? 'active' : 'bench';
      const benchIndex = resolved.benchIndices?.[i];

      if (location === 'active') {
        newState = updateActive(newState, resolved.player, (p) =>
          p ? updatePokemonDamage(p, newDamage) : null
        );
      } else if (benchIndex !== undefined) {
        newState = updateBench(newState, resolved.player, benchIndex, (p) =>
          p ? updatePokemonDamage(p, newDamage) : null
        );
      }

      messages.push({
        type: 'damage',
        message: `${pokemon.card.name} took ${damage} damage`,
        data: {
          pokemon: pokemon.card.name,
          damage,
          totalDamage: newDamage,
          remainingHp: pokemon.maxHp - newDamage,
          player: resolved.player,
        },
      });
    }
  }

  return {
    state: newState,
    messages,
    pendingEffects: pendingEffects.length > 0 ? pendingEffects : undefined,
  };
}

export const damageExecutor = {
  effectType: EffectType.Damage,
  execute: executeDamage,
};
