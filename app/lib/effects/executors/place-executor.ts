/**
 * Place executor - places Pokemon on bench from hand or other locations
 */

import { GameState, CardInstance, PokemonState } from '../../notation/training-format';
import { Effect, EffectType, PlaceEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';
import { resolveTarget } from './utils/target-resolver';
import {
  removeFromHand,
  addToBench,
  createPokemonState,
  findEmptyBenchSlot,
} from './utils/state-helpers';

/**
 * Execute a place effect (put Pokemon on bench)
 */
export async function executePlace(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const placeEffect = effect as PlaceEffect;

  // Determine source (usually hand)
  const source = placeEffect.targets?.[0] || {
    type: 'card' as const,
    player: 'self' as const,
    location: { type: 'hand' as const },
  };

  const resolved = resolveTarget(state, source);

  // Filter to Pokemon cards (typically basic Pokemon)
  const pokemonCards = resolved.cards.filter(c => c.type === 'pokemon');

  if (pokemonCards.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No Pokemon available to place',
        data: {},
      }],
    };
  }

  // Check if there's bench space
  const emptySlot = findEmptyBenchSlot(state, 'self');
  if (emptySlot === null) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No bench space available',
        data: {},
      }],
    };
  }

  const count = placeEffect.value || 1;
  const isUpTo = placeEffect.isUpTo || false;
  const selection = placeEffect.selection || 'choose';

  let selectedCards: CardInstance[] = [];

  if (selection === 'all') {
    selectedCards = pokemonCards;
  } else if (selection === 'random') {
    selectedCards = context.rng.pickRandom(pokemonCards, count);
  } else {
    // Player choice
    const choiceRequest: ChoiceRequest = {
      type: 'select-card',
      player: 'self',
      options: pokemonCards.map(card => ({
        id: card.id,
        label: card.name,
        data: card,
      })),
      minSelections: isUpTo ? 0 : Math.min(count, pokemonCards.length),
      maxSelections: Math.min(count, pokemonCards.length),
      message: isUpTo
        ? `Select up to ${count} Pokemon to place on bench`
        : `Select ${count} Pokemon to place on bench`,
    };

    const selectedIndices = await context.chooseForSelf(choiceRequest);
    selectedCards = selectedIndices.map(i => pokemonCards[i]);
  }

  if (selectedCards.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No Pokemon selected to place',
        data: {},
      }],
    };
  }

  let newState = state;
  const placedPokemon: string[] = [];
  const messages: ExecutionMessage[] = [];

  for (const card of selectedCards) {
    // Check bench space for each Pokemon
    const slot = findEmptyBenchSlot(newState, 'self');
    if (slot === null) {
      messages.push({
        type: 'info',
        message: `Could not place ${card.name} - bench is full`,
        data: { card: card.name },
      });
      break;
    }

    // Remove from hand
    newState = removeFromHand(newState, [card.id]);

    // Create Pokemon state (default HP - would need card data for actual HP)
    const pokemonState = createPokemonState(card, 60); // Default HP

    // Add to bench
    const resultState = addToBench(newState, 'self', pokemonState);
    if (resultState) {
      newState = resultState;
      placedPokemon.push(card.name);
    }
  }

  if (placedPokemon.length > 0) {
    messages.unshift({
      type: 'info',
      message: `Placed ${placedPokemon.join(', ')} on bench`,
      data: { pokemon: placedPokemon },
    });
  }

  return { state: newState, messages };
}

export const placeExecutor = {
  effectType: EffectType.Place,
  execute: executePlace,
};
