/**
 * Counter executor - places, moves, or removes damage counters
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, CounterEffect } from '../types';
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
 * Execute a counter effect (damage counters)
 */
export async function executeCounter(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const counterEffect = effect as CounterEffect;
  const counters = counterEffect.value || 0;
  const action = counterEffect.action || 'place';

  if (counters <= 0) {
    return { state, messages: [] };
  }

  // Each damage counter = 10 damage
  const damageAmount = counters * 10;

  // Determine target
  const target = counterEffect.targets?.[0] || {
    type: 'pokemon' as const,
    player: counterEffect.target || 'opponent',
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

    let newDamage: number;
    switch (action) {
      case 'place':
        newDamage = pokemon.damage + damageAmount;
        break;
      case 'remove':
        newDamage = Math.max(0, pokemon.damage - damageAmount);
        break;
      case 'move':
        // Move action would need a second target - for now, treat as place
        newDamage = pokemon.damage + damageAmount;
        break;
      default:
        newDamage = pokemon.damage + damageAmount;
    }

    const isKnockout = newDamage >= pokemon.maxHp;
    const location = resolved.location === 'active' ? 'active' : 'bench';
    const benchIndex = resolved.benchIndices?.[i];

    if (isKnockout && action === 'place') {
      // Handle knockout from damage counters
      const [stateAfterKO] = knockoutPokemon(
        newState,
        resolved.player,
        location as 'active' | 'bench',
        benchIndex
      );
      newState = stateAfterKO;

      const prizeTaker = resolved.player === 'self' ? 'opponent' : 'self';
      newState = takePrize(newState, prizeTaker, 1);

      messages.push({
        type: 'knockout',
        message: `${pokemon.card.name} was knocked out from damage counters!`,
        data: {
          pokemon: pokemon.card.name,
          counters,
          player: resolved.player,
        },
      });
    } else {
      // Update damage
      if (location === 'active') {
        newState = updateActive(newState, resolved.player, (p) =>
          p ? updatePokemonDamage(p, newDamage) : null
        );
      } else if (benchIndex !== undefined) {
        newState = updateBench(newState, resolved.player, benchIndex, (p) =>
          p ? updatePokemonDamage(p, newDamage) : null
        );
      }

      const actionVerb = action === 'remove' ? 'removed from' : 'placed on';
      messages.push({
        type: 'counter',
        message: `${counters} damage counter(s) ${actionVerb} ${pokemon.card.name}`,
        data: {
          pokemon: pokemon.card.name,
          counters,
          action,
          totalDamage: newDamage,
          player: resolved.player,
        },
      });
    }
  }

  return { state: newState, messages };
}

export const counterExecutor = {
  effectType: EffectType.Counter,
  execute: executeCounter,
};
