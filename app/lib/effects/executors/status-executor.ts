/**
 * Status executor - applies status conditions to Pokemon
 */

import { GameState, StatusCondition } from '../../notation/training-format';
import { Effect, EffectType, StatusEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { resolveTarget } from './utils/target-resolver';
import { updateActive, updateBench, updatePokemonStatus } from './utils/state-helpers';

/**
 * Execute a status effect
 */
export async function executeStatus(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const statusEffect = effect as StatusEffect;
  const statusType = statusEffect.status;

  if (!statusType) {
    return { state, messages: [] };
  }

  // Determine target - default to opponent's active
  const target = statusEffect.targets?.[0] || {
    type: 'pokemon' as const,
    player: statusEffect.target || 'opponent',
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

    // Create the status condition
    const newStatus: StatusCondition = {
      type: statusType,
      turnsRemaining: getDefaultTurnsRemaining(statusType),
    };

    const location = resolved.location === 'active' ? 'active' : 'bench';
    const benchIndex = resolved.benchIndices?.[i];

    // Note: Status conditions typically only apply to active Pokemon
    // Bench Pokemon cannot be Paralyzed, Asleep, or Confused
    // But Burned and Poisoned can apply to bench in some cases
    if (location === 'bench' && ['paralyzed', 'asleep', 'confused'].includes(statusType)) {
      messages.push({
        type: 'info',
        message: `${pokemon.card.name} is on the bench and cannot be ${statusType}`,
        data: { pokemon: pokemon.card.name, status: statusType },
      });
      continue;
    }

    if (location === 'active') {
      newState = updateActive(newState, resolved.player, (p) =>
        p ? updatePokemonStatus(p, newStatus) : null
      );
    } else if (benchIndex !== undefined) {
      newState = updateBench(newState, resolved.player, benchIndex, (p) =>
        p ? updatePokemonStatus(p, newStatus) : null
      );
    }

    messages.push({
      type: 'status',
      message: `${pokemon.card.name} is now ${statusType}!`,
      data: {
        pokemon: pokemon.card.name,
        status: statusType,
        player: resolved.player,
      },
    });
  }

  return { state: newState, messages };
}

/**
 * Get default turns remaining for a status condition
 */
function getDefaultTurnsRemaining(
  status: StatusCondition['type']
): number | undefined {
  switch (status) {
    case 'paralyzed':
      return 1; // Paralysis wears off at the end of the affected player's turn
    case 'asleep':
      return undefined; // Sleep requires coin flip to wake up
    case 'confused':
      return undefined; // Confusion requires coin flip or retreat to cure
    case 'burned':
      return undefined; // Burn persists until retreated or healed
    case 'poisoned':
      return undefined; // Poison persists until retreated or healed
    default:
      return undefined;
  }
}

/**
 * Remove status from a Pokemon (e.g., when retreating or using a healing card)
 */
export async function executeRemoveStatus(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
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

  let newState = state;
  const messages: ExecutionMessage[] = [];

  for (let i = 0; i < resolved.pokemon.length; i++) {
    const pokemon = resolved.pokemon[i];

    if (!pokemon.status) {
      continue; // No status to remove
    }

    const oldStatus = pokemon.status.type;
    const location = resolved.location === 'active' ? 'active' : 'bench';
    const benchIndex = resolved.benchIndices?.[i];

    if (location === 'active') {
      newState = updateActive(newState, resolved.player, (p) =>
        p ? updatePokemonStatus(p, null) : null
      );
    } else if (benchIndex !== undefined) {
      newState = updateBench(newState, resolved.player, benchIndex, (p) =>
        p ? updatePokemonStatus(p, null) : null
      );
    }

    messages.push({
      type: 'status',
      message: `${pokemon.card.name} is no longer ${oldStatus}`,
      data: {
        pokemon: pokemon.card.name,
        status: null,
        previousStatus: oldStatus,
        player: resolved.player,
      },
    });
  }

  return { state: newState, messages };
}

export const statusExecutor = {
  effectType: EffectType.Status,
  execute: executeStatus,
};
