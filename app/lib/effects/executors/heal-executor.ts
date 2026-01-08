/**
 * Heal executor - heals HP or removes damage counters from Pokemon
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, HealEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { resolveTarget } from './utils/target-resolver';
import { updateActive, updateBench, updatePokemonDamage } from './utils/state-helpers';

/**
 * Execute a heal effect
 */
export async function executeHeal(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const healEffect = effect as HealEffect;

  // Determine heal amount
  // If unit is 'damage-counters', convert to HP (1 counter = 10 HP)
  let healAmount = healEffect.value || 0;
  if (healEffect.unit === 'damage-counters') {
    healAmount = healAmount * 10;
  }

  if (healAmount <= 0) {
    return { state, messages: [] };
  }

  // Determine target - use targets array or default to self active
  const target = healEffect.targets?.[0] || {
    type: 'pokemon' as const,
    player: healEffect.target || 'self',
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);

  if (resolved.pokemon.length === 0) {
    return { state, messages: [] };
  }

  let newState = state;
  const messages: ExecutionMessage[] = [];

  for (let i = 0; i < resolved.pokemon.length; i++) {
    const pokemon = resolved.pokemon[i];
    const currentDamage = pokemon.damage;

    if (currentDamage === 0) {
      continue; // Already at full HP
    }

    // Calculate new damage (can't go below 0)
    const actualHeal = Math.min(healAmount, currentDamage);
    const newDamage = currentDamage - actualHeal;

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
      type: 'heal',
      message: `${pokemon.card.name} healed ${actualHeal} HP`,
      data: {
        pokemon: pokemon.card.name,
        healAmount: actualHeal,
        newHp: pokemon.maxHp - newDamage,
        player: resolved.player,
      },
    });
  }

  return { state: newState, messages };
}

export const healExecutor = {
  effectType: EffectType.Heal,
  execute: executeHeal,
};
