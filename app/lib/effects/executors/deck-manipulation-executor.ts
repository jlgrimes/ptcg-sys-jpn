/**
 * Deck manipulation executor - look at, rearrange, or manipulate deck cards
 */

import { GameState, CardInstance } from '../../notation/training-format';
import { Effect, EffectType, DeckManipulationEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';

/**
 * Execute a deck manipulation effect
 */
export async function executeDeckManipulation(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const deckEffect = effect as DeckManipulationEffect;
  const action = deckEffect.action || 'look';
  const count = deckEffect.count || 1;

  switch (action) {
    case 'look':
      return executeLookAtDeck(state, count, context);
    case 'rearrange':
      return executeRearrangeDeck(state, count, context);
    case 'put-on-top':
      return executePutOnTop(state, deckEffect, context);
    case 'put-on-bottom':
      return executePutOnBottom(state, deckEffect, context);
    case 'shuffle-into':
      return executeShuffleInto(state, deckEffect, context);
    default:
      return { state, messages: [] };
  }
}

/**
 * Look at top cards of deck
 */
async function executeLookAtDeck(
  state: GameState,
  count: number,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const deckSize = state.deck.size;
  const actualCount = Math.min(count, deckSize);

  if (actualCount === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'Deck is empty - nothing to look at',
        data: {},
      }],
    };
  }

  // In a real game, this would reveal actual cards
  // For now, create placeholder known cards
  const knownCards = state.deck.knownCards || [];
  const revealedCards = knownCards.slice(0, actualCount);

  // If we have fewer known cards than we want to look at,
  // we're looking at unknown cards too
  const unknownCount = actualCount - revealedCards.length;

  const messages: ExecutionMessage[] = [{
    type: 'info',
    message: `Looking at top ${actualCount} card(s) of deck`,
    data: {
      count: actualCount,
      knownCards: revealedCards.map(c => c.name),
      unknownCount,
    },
  }];

  return { state, messages };
}

/**
 * Rearrange top cards of deck
 */
async function executeRearrangeDeck(
  state: GameState,
  count: number,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const knownCards = state.deck.knownCards || [];
  const cardsToRearrange = knownCards.slice(0, Math.min(count, knownCards.length));

  if (cardsToRearrange.length < 2) {
    return {
      state,
      messages: [{
        type: 'info',
        message: cardsToRearrange.length === 0
          ? 'No known cards to rearrange'
          : 'Only one card - no rearrangement needed',
        data: {},
      }],
    };
  }

  // Request player choice for order
  const choiceRequest: ChoiceRequest = {
    type: 'select-card',
    player: 'self',
    options: cardsToRearrange.map((card, i) => ({
      id: card.id,
      label: `${i + 1}. ${card.name}`,
      data: card,
    })),
    minSelections: cardsToRearrange.length,
    maxSelections: cardsToRearrange.length,
    message: `Select cards in the order you want them (top of deck first)`,
  };

  const selectedIndices = await context.chooseForSelf(choiceRequest);
  const reorderedCards = selectedIndices.map(i => cardsToRearrange[i]);

  // Update deck's known cards
  const newKnownCards = [
    ...reorderedCards,
    ...knownCards.slice(cardsToRearrange.length),
  ];

  const newState: GameState = {
    ...state,
    deck: {
      ...state.deck,
      knownCards: newKnownCards,
    },
  };

  return {
    state: newState,
    messages: [{
      type: 'info',
      message: `Rearranged top ${cardsToRearrange.length} cards of deck`,
      data: { newOrder: reorderedCards.map(c => c.name) },
    }],
  };
}

/**
 * Put a card on top of deck
 */
async function executePutOnTop(
  state: GameState,
  effect: DeckManipulationEffect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  // This would typically be used with a target specifying
  // which card to put on top (from hand, discard, etc.)
  // For now, return placeholder

  return {
    state,
    messages: [{
      type: 'info',
      message: 'Put card on top of deck',
      data: {},
    }],
  };
}

/**
 * Put a card on bottom of deck
 */
async function executePutOnBottom(
  state: GameState,
  effect: DeckManipulationEffect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  return {
    state,
    messages: [{
      type: 'info',
      message: 'Put card on bottom of deck',
      data: {},
    }],
  };
}

/**
 * Shuffle cards into deck
 */
async function executeShuffleInto(
  state: GameState,
  effect: DeckManipulationEffect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  // Shuffle clears known cards
  const newState: GameState = {
    ...state,
    deck: {
      size: state.deck.size,
      knownCards: undefined,
    },
  };

  return {
    state: newState,
    messages: [{
      type: 'info',
      message: 'Shuffled cards into deck',
      data: {},
    }],
  };
}

export const deckManipulationExecutor = {
  effectType: EffectType.DeckManipulation,
  execute: executeDeckManipulation,
};
