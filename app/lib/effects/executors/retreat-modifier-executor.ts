/**
 * Retreat modifier executor - modifies retreat cost
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, RetreatModifierEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { resolveTarget } from './utils/target-resolver';
import { updateActive, updateBench } from './utils/state-helpers';

/**
 * Execute a retreat modifier effect
 */
export async function executeRetreatModifier(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const retreatEffect = effect as RetreatModifierEffect;
  const modification = retreatEffect.modification || 0;

  // Determine target
  const target = retreatEffect.targets?.[0] || {
    type: 'pokemon' as const,
    player: retreatEffect.target || 'opponent',
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
    const newRetreatCost = Math.max(0, pokemon.retreatCost + modification);

    const location = resolved.location === 'active' ? 'active' : 'bench';
    const benchIndex = resolved.benchIndices?.[i];

    const updater = (p: typeof pokemon | null) => {
      if (!p) return null;
      return {
        ...p,
        retreatCost: newRetreatCost,
      };
    };

    if (location === 'active') {
      newState = updateActive(newState, resolved.player, updater);
    } else if (benchIndex !== undefined) {
      newState = updateBench(newState, resolved.player, benchIndex, updater);
    }

    const changeText = modification > 0 ? `increased by ${modification}` : `decreased by ${Math.abs(modification)}`;
    messages.push({
      type: 'info',
      message: `${pokemon.card.name}'s retreat cost ${changeText} (now ${newRetreatCost})`,
      data: {
        pokemon: pokemon.card.name,
        modification,
        newCost: newRetreatCost,
        player: resolved.player,
      },
    });
  }

  return { state: newState, messages };
}

export const retreatModifierExecutor = {
  effectType: EffectType.RetreatModifier,
  execute: executeRetreatModifier,
};
