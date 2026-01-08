/**
 * Energy executor - attaches, moves, or discards energy
 */

import { GameState, CardInstance, PokemonState } from '../../notation/training-format';
import { Effect, EffectType, EnergyEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';
import { resolveTarget, getAllPokemonInPlay } from './utils/target-resolver';
import {
  attachEnergy,
  removeEnergy,
  addToDiscard,
  removeFromHand,
} from './utils/state-helpers';

/**
 * Execute an energy effect
 */
export async function executeEnergy(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const energyEffect = effect as EnergyEffect;
  const action = energyEffect.action || 'attach';

  switch (action) {
    case 'attach':
      return executeEnergyAttach(state, energyEffect, context);
    case 'discard':
      return executeEnergyDiscard(state, energyEffect, context);
    case 'move':
      return executeEnergyMove(state, energyEffect, context);
    default:
      return { state, messages: [] };
  }
}

/**
 * Attach energy from hand or discard to a Pokemon
 */
async function executeEnergyAttach(
  state: GameState,
  effect: EnergyEffect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  // Get energy cards from source
  const sourceLocation = effect.source || 'hand';
  const source = effect.targets?.[0] || {
    type: 'energy' as const,
    player: 'self' as const,
    location: { type: sourceLocation as 'hand' | 'discard' },
  };

  const resolved = resolveTarget(state, source);
  const energyCards = resolved.cards.filter(c => c.type === 'energy');

  if (energyCards.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No energy cards available to attach',
        data: {},
      }],
    };
  }

  const count = effect.targetCount || effect.value || 1;
  const isUpTo = effect.isUpTo || false;
  const selection = effect.selection || 'choose';

  // Select energy cards
  let selectedEnergy: CardInstance[] = [];
  if (selection === 'all') {
    selectedEnergy = energyCards.slice(0, count === 'all' ? energyCards.length : count);
  } else if (selection === 'random') {
    selectedEnergy = context.rng.pickRandom(energyCards, typeof count === 'number' ? count : energyCards.length);
  } else {
    const choiceRequest: ChoiceRequest = {
      type: 'select-energy',
      player: 'self',
      options: energyCards.map(card => ({
        id: card.id,
        label: card.name,
        data: card,
      })),
      minSelections: isUpTo ? 0 : Math.min(typeof count === 'number' ? count : energyCards.length, energyCards.length),
      maxSelections: Math.min(typeof count === 'number' ? count : energyCards.length, energyCards.length),
      message: `Select energy to attach`,
    };

    const selectedIndices = await context.chooseForSelf(choiceRequest);
    selectedEnergy = selectedIndices.map(i => energyCards[i]);
  }

  if (selectedEnergy.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No energy selected to attach',
        data: {},
      }],
    };
  }

  // Select target Pokemon
  const targetPlayer = effect.target || 'self';
  const allPokemon = getAllPokemonInPlay(state, targetPlayer as 'self' | 'opponent');

  if (allPokemon.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No Pokemon available to attach energy to',
        data: {},
      }],
    };
  }

  let targetPokemon: PokemonState;
  let targetLocation: 'active' | 'bench';
  let benchIndex: number | undefined;

  if (allPokemon.length === 1) {
    targetPokemon = allPokemon[0];
    targetLocation = (targetPlayer === 'self' ? state.active : state.opponent.active) === targetPokemon ? 'active' : 'bench';
  } else {
    const chooseCallback = targetPlayer === 'self' ? context.chooseForSelf : context.chooseForOpponent;

    const options = allPokemon.map(p => {
      const isActive = (targetPlayer === 'self' ? state.active : state.opponent.active) === p;
      const bench = targetPlayer === 'self' ? state.bench : state.opponent.bench;
      const bIndex = isActive ? undefined : bench.findIndex(bp => bp === p);

      return {
        id: p.card.id,
        label: `${p.card.name} ${isActive ? '(Active)' : '(Bench)'} - ${p.attachedEnergy.length} energy`,
        data: { pokemon: p, location: isActive ? 'active' : 'bench', benchIndex: bIndex },
      };
    });

    const choiceRequest: ChoiceRequest = {
      type: 'select-pokemon',
      player: targetPlayer as 'self' | 'opponent',
      options,
      minSelections: 1,
      maxSelections: 1,
      message: 'Select a Pokemon to attach energy to',
    };

    const selectedIndices = await chooseCallback(choiceRequest);
    const selected = options[selectedIndices[0]];
    const data = selected.data as { pokemon: PokemonState; location: 'active' | 'bench'; benchIndex?: number };

    targetPokemon = data.pokemon;
    targetLocation = data.location;
    benchIndex = data.benchIndex;
  }

  // Perform attachment
  let newState = state;

  // Remove energy from source
  if (sourceLocation === 'hand') {
    newState = removeFromHand(newState, selectedEnergy.map(e => e.id));
  }
  // (Would handle discard source similarly)

  // Attach to target
  for (const energy of selectedEnergy) {
    newState = attachEnergy(
      newState,
      targetPlayer as 'self' | 'opponent',
      targetLocation,
      energy,
      benchIndex
    );
  }

  const messages: ExecutionMessage[] = [{
    type: 'energy',
    message: `Attached ${selectedEnergy.length} energy to ${targetPokemon.card.name}`,
    data: {
      energy: selectedEnergy.map(e => e.name),
      target: targetPokemon.card.name,
      player: targetPlayer,
    },
  }];

  return { state: newState, messages };
}

/**
 * Discard energy from a Pokemon
 */
async function executeEnergyDiscard(
  state: GameState,
  effect: EnergyEffect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const targetPlayer = effect.target || 'self';
  const target = effect.targets?.[0] || {
    type: 'pokemon' as const,
    player: targetPlayer as 'self' | 'opponent',
    location: { type: 'active' as const },
  };

  const resolved = resolveTarget(state, target);

  if (resolved.pokemon.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No Pokemon to discard energy from',
        data: {},
      }],
    };
  }

  const pokemon = resolved.pokemon[0];
  const availableEnergy = pokemon.attachedEnergy;

  if (availableEnergy.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: `${pokemon.card.name} has no energy to discard`,
        data: {},
      }],
    };
  }

  const count = effect.value || 1;
  const isUpTo = effect.isUpTo || false;
  const selection = effect.selection || 'choose';

  let energyToDiscard: CardInstance[] = [];

  if (selection === 'all') {
    energyToDiscard = availableEnergy;
  } else if (selection === 'random') {
    energyToDiscard = context.rng.pickRandom(availableEnergy, count);
  } else {
    const chooseCallback = targetPlayer === 'self' ? context.chooseForSelf : context.chooseForOpponent;

    const choiceRequest: ChoiceRequest = {
      type: 'select-energy',
      player: targetPlayer as 'self' | 'opponent',
      options: availableEnergy.map(e => ({
        id: e.id,
        label: e.name,
        data: e,
      })),
      minSelections: isUpTo ? 0 : Math.min(count, availableEnergy.length),
      maxSelections: Math.min(count, availableEnergy.length),
      message: `Select ${isUpTo ? 'up to ' : ''}${count} energy to discard from ${pokemon.card.name}`,
    };

    const selectedIndices = await chooseCallback(choiceRequest);
    energyToDiscard = selectedIndices.map(i => availableEnergy[i]);
  }

  if (energyToDiscard.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No energy discarded',
        data: {},
      }],
    };
  }

  // Remove energy and add to discard
  let newState = state;
  const location = resolved.location === 'active' ? 'active' : 'bench';
  const benchIndex = resolved.benchIndices?.[0];

  for (const energy of energyToDiscard) {
    const [stateAfterRemove, removed] = removeEnergy(
      newState,
      targetPlayer as 'self' | 'opponent',
      location as 'active' | 'bench',
      energy.id,
      benchIndex
    );
    newState = stateAfterRemove;
    if (removed) {
      newState = addToDiscard(newState, targetPlayer as 'self' | 'opponent', [removed]);
    }
  }

  const messages: ExecutionMessage[] = [{
    type: 'energy',
    message: `Discarded ${energyToDiscard.length} energy from ${pokemon.card.name}`,
    data: {
      energy: energyToDiscard.map(e => e.name),
      from: pokemon.card.name,
      player: targetPlayer,
    },
  }];

  return { state: newState, messages };
}

/**
 * Move energy between Pokemon
 */
async function executeEnergyMove(
  state: GameState,
  effect: EnergyEffect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  // This would be similar to discard + attach
  // For now, return a placeholder
  return {
    state,
    messages: [{
      type: 'info',
      message: 'Energy move not yet fully implemented',
      data: {},
    }],
  };
}

export const energyExecutor = {
  effectType: EffectType.Energy,
  execute: executeEnergy,
};
