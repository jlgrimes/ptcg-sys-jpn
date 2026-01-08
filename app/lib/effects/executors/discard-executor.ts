/**
 * Discard executor - discards cards from various locations
 */

import { GameState, CardInstance } from '../../notation/training-format';
import { Effect, EffectType, DiscardEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';
import { resolveTarget } from './utils/target-resolver';
import { removeFromHand, addToDiscard } from './utils/state-helpers';

/**
 * Execute a discard effect
 */
export async function executeDiscard(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const discardEffect = effect as DiscardEffect;

  // Determine target and source
  const target = discardEffect.targets?.[0] || {
    type: 'card' as const,
    player: discardEffect.target || 'self',
    location: { type: 'hand' as const },
    count: discardEffect.value || 1,
  };

  const resolved = resolveTarget(state, target);

  if (resolved.cards.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No cards available to discard',
        data: {},
      }],
    };
  }

  const count = target.count === 'all' ? resolved.cards.length : (target.count || 1);
  const isUpTo = discardEffect.isUpTo || false;
  const selection = discardEffect.selection || 'choose';

  let cardsToDiscard: CardInstance[] = [];

  if (selection === 'all') {
    // Discard all matching cards
    cardsToDiscard = resolved.cards;
  } else if (selection === 'random') {
    // Random selection
    cardsToDiscard = context.rng.pickRandom(resolved.cards, count);
  } else {
    // Player choice
    if (resolved.cards.length <= count && !isUpTo) {
      // Must discard all if not enough cards
      cardsToDiscard = resolved.cards;
    } else {
      // Request player choice
      const choiceRequest: ChoiceRequest = {
        type: 'select-card',
        player: resolved.player,
        options: resolved.cards.map(card => ({
          id: card.id,
          label: card.name,
          data: card,
        })),
        minSelections: isUpTo ? 0 : Math.min(count, resolved.cards.length),
        maxSelections: Math.min(count, resolved.cards.length),
        message: isUpTo
          ? `Select up to ${count} card(s) to discard`
          : `Select ${count} card(s) to discard`,
      };

      const chooseCallback = resolved.player === 'self'
        ? context.chooseForSelf
        : context.chooseForOpponent;

      const selectedIndices = await chooseCallback(choiceRequest);
      cardsToDiscard = selectedIndices.map(i => resolved.cards[i]);
    }
  }

  if (cardsToDiscard.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No cards discarded',
        data: {},
      }],
    };
  }

  // Remove cards from source and add to discard
  let newState = state;

  if (resolved.location === 'hand') {
    newState = removeFromHand(newState, cardsToDiscard.map(c => c.id));
    newState = addToDiscard(newState, 'self', cardsToDiscard);
  } else if (resolved.location === 'deck') {
    // Remove from known cards in deck
    const cardIds = new Set(cardsToDiscard.map(c => c.id));
    newState = {
      ...newState,
      deck: {
        ...newState.deck,
        size: newState.deck.size - cardsToDiscard.length,
        knownCards: newState.deck.knownCards?.filter(c => !cardIds.has(c.id)),
      },
    };
    newState = addToDiscard(newState, 'self', cardsToDiscard);
  }
  // Note: Discarding from other locations (bench Pokemon's energy, etc.)
  // would be handled by energy-executor

  const messages: ExecutionMessage[] = [{
    type: 'discard',
    message: `Discarded ${cardsToDiscard.length} card(s): ${cardsToDiscard.map(c => c.name).join(', ')}`,
    data: {
      cards: cardsToDiscard.map(c => ({ id: c.id, name: c.name })),
      count: cardsToDiscard.length,
      from: resolved.location,
    },
  }];

  return { state: newState, messages };
}

export const discardExecutor = {
  effectType: EffectType.Discard,
  execute: executeDiscard,
};
