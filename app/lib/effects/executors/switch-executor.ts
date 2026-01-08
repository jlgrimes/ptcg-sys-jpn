/**
 * Switch executor - switches active Pokemon with bench Pokemon
 */

import { GameState, PokemonState } from '../../notation/training-format';
import { Effect, EffectType, SwitchEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';
import { switchPokemon, updatePokemonStatus } from './utils/state-helpers';
import { countBenchPokemon } from './utils/target-resolver';

/**
 * Execute a switch effect
 */
export async function executeSwitch(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const switchEffect = effect as SwitchEffect;

  // Determine whose Pokemon is switching
  const player = switchEffect.target || 'self';
  const isForced = switchEffect.selection === 'random' || player === 'opponent';

  const bench = player === 'self' ? state.bench : state.opponent.bench;
  const active = player === 'self' ? state.active : state.opponent.active;

  // Check if there are bench Pokemon to switch to
  const benchPokemon = bench.filter((p): p is PokemonState => p !== null);
  if (benchPokemon.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: `No bench Pokemon available to switch`,
        data: { player },
      }],
    };
  }

  let selectedIndex: number;

  if (switchEffect.selection === 'random' || benchPokemon.length === 1) {
    // Random selection or only one option
    if (switchEffect.selection === 'random') {
      const randomPokemon = context.rng.pickRandom(benchPokemon, 1)[0];
      selectedIndex = bench.findIndex(p => p === randomPokemon);
    } else {
      // Only one bench Pokemon, auto-select
      selectedIndex = bench.findIndex(p => p !== null);
    }
  } else {
    // Player choice
    const chooseCallback = player === 'self'
      ? context.chooseForSelf
      : context.chooseForOpponent;

    const options = benchPokemon.map((p, originalBenchIndex) => {
      // Find the actual bench index
      let actualIndex = -1;
      let count = 0;
      for (let i = 0; i < bench.length; i++) {
        if (bench[i] !== null) {
          if (count === originalBenchIndex) {
            actualIndex = i;
            break;
          }
          count++;
        }
      }
      return {
        id: p.card.id,
        label: `${p.card.name} (HP: ${p.hp}/${p.maxHp})`,
        data: { pokemon: p, benchIndex: actualIndex },
      };
    });

    const choiceRequest: ChoiceRequest = {
      type: 'select-pokemon',
      player: player as 'self' | 'opponent',
      options,
      minSelections: 1,
      maxSelections: 1,
      message: isForced
        ? `Select a Pokemon to switch to the Active spot`
        : `Select a bench Pokemon to switch with your Active Pokemon`,
    };

    const selectedIndices = await chooseCallback(choiceRequest);
    const selected = options[selectedIndices[0]];
    selectedIndex = (selected.data as { benchIndex: number }).benchIndex;
  }

  if (selectedIndex === -1) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'Switch failed: no valid target',
        data: {},
      }],
    };
  }

  // Perform the switch
  let newState = switchPokemon(state, player as 'self' | 'opponent', selectedIndex);

  // Switching to bench removes special conditions (Paralyzed, Asleep, Confused)
  // The Pokemon that was active (now on bench) loses those conditions
  if (active?.status) {
    const statusType = active.status.type;
    if (['paralyzed', 'asleep', 'confused'].includes(statusType)) {
      // Find where the old active is now (it's at selectedIndex on bench)
      newState = {
        ...newState,
        ...(player === 'self' ? {
          bench: newState.bench.map((p, i) =>
            i === selectedIndex && p ? { ...p, status: null } : p
          ),
        } : {
          opponent: {
            ...newState.opponent,
            bench: newState.opponent.bench.map((p, i) =>
              i === selectedIndex && p ? { ...p, status: null } : p
            ),
          },
        }),
      };
    }
  }

  const newActive = player === 'self' ? newState.active : newState.opponent.active;
  const messages: ExecutionMessage[] = [{
    type: 'switch',
    message: `Switched to ${newActive?.card.name}`,
    data: {
      newActive: newActive?.card.name,
      previousActive: active?.card.name,
      player,
    },
  }];

  return { state: newState, messages };
}

export const switchExecutor = {
  effectType: EffectType.Switch,
  execute: executeSwitch,
};
