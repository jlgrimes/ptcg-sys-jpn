/**
 * Search executor - searches deck for cards and adds them to hand
 */

import { GameState, CardInstance } from '../../notation/training-format';
import { Effect, EffectType, SearchEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';
import { resolveTarget } from './utils/target-resolver';
import { addToHand, shuffleDeck } from './utils/state-helpers';

/**
 * Execute a search effect
 */
export async function executeSearch(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const searchEffect = effect as SearchEffect;

  // Determine what we're searching for
  const target = searchEffect.targets?.[0] || {
    type: 'card' as const,
    player: 'self' as const,
    location: { type: 'deck' as const, shuffle: true },
    count: 1,
  };

  // For search, we need to look at the deck
  // In a real game, deck contents would be known during search
  // For now, we work with knownCards or create placeholders

  const resolved = resolveTarget(state, target);

  // If no known cards in deck, we can't actually search
  // In a real implementation, the search would reveal the deck
  if (resolved.cards.length === 0 && state.deck.size > 0) {
    // Create placeholder cards for selection
    // In a real game, you'd see the actual deck contents
    return {
      state,
      messages: [{
        type: 'info',
        message: 'Search effect: deck contents unknown',
        data: {},
      }],
    };
  }

  if (resolved.cards.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No matching cards found in deck',
        data: {},
      }],
    };
  }

  const count = target.count === 'all' ? resolved.cards.length : (target.count || 1);
  const isUpTo = searchEffect.isUpTo || false;
  const selection = searchEffect.selection || 'choose';

  let selectedCards: CardInstance[] = [];

  if (selection === 'all') {
    selectedCards = resolved.cards;
  } else if (selection === 'random') {
    selectedCards = context.rng.pickRandom(resolved.cards, count);
  } else {
    // Player choice
    const choiceRequest: ChoiceRequest = {
      type: 'select-card',
      player: 'self',
      options: resolved.cards.map(card => ({
        id: card.id,
        label: card.name,
        data: card,
      })),
      minSelections: isUpTo ? 0 : Math.min(count, resolved.cards.length),
      maxSelections: Math.min(count, resolved.cards.length),
      message: isUpTo
        ? `Search deck: select up to ${count} card(s)`
        : `Search deck: select ${count} card(s)`,
    };

    const selectedIndices = await context.chooseForSelf(choiceRequest);
    selectedCards = selectedIndices.map(i => resolved.cards[i]);
  }

  if (selectedCards.length === 0) {
    let newState = state;
    // Still shuffle even if nothing selected
    if (target.location.shuffle !== false) {
      newState = shuffleDeck(newState);
    }
    return {
      state: newState,
      messages: [{
        type: 'search',
        message: 'Searched deck but selected no cards',
        data: {},
      }],
    };
  }

  // Remove selected cards from deck's known cards
  const selectedIds = new Set(selectedCards.map(c => c.id));
  let newState: GameState = {
    ...state,
    deck: {
      size: state.deck.size - selectedCards.length,
      knownCards: state.deck.knownCards?.filter(c => !selectedIds.has(c.id)),
    },
  };

  // Add to hand
  newState = addToHand(newState, selectedCards);

  // Shuffle if required (default is true for search)
  if (target.location.shuffle !== false) {
    newState = shuffleDeck(newState);
  }

  const messages: ExecutionMessage[] = [{
    type: 'search',
    message: `Searched deck and added ${selectedCards.length} card(s) to hand: ${selectedCards.map(c => c.name).join(', ')}`,
    data: {
      cards: selectedCards.map(c => ({ id: c.id, name: c.name })),
      count: selectedCards.length,
      shuffled: target.location.shuffle !== false,
    },
  }];

  return { state: newState, messages };
}

export const searchExecutor = {
  effectType: EffectType.Search,
  execute: executeSearch,
};
