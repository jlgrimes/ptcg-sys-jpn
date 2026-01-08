/**
 * Prize executor - manipulates prize cards
 */

import { GameState, CardInstance } from '../../notation/training-format';
import { Effect, EffectType, PrizeEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';
import { takePrize, addToHand } from './utils/state-helpers';

/**
 * Execute a prize effect
 */
export async function executePrize(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const prizeEffect = effect as PrizeEffect;
  const action = prizeEffect.action || 'take-extra';
  const count = prizeEffect.count || 1;

  switch (action) {
    case 'take-extra':
      return executeTakeExtraPrize(state, count, context);
    case 'look':
      return executeLookAtPrizes(state, count, context);
    case 'swap':
      return executeSwapPrize(state, context);
    case 'put-back':
      return executePutBackPrize(state, context);
    default:
      return { state, messages: [] };
  }
}

/**
 * Take extra prize cards
 */
async function executeTakeExtraPrize(
  state: GameState,
  count: number,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const available = state.prizes.remaining;

  if (available === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No prize cards remaining',
        data: {},
      }],
    };
  }

  const actualCount = Math.min(count, available);
  const newState = takePrize(state, 'self', actualCount);

  return {
    state: newState,
    messages: [{
      type: 'info',
      message: `Took ${actualCount} extra prize card(s)`,
      data: {
        count: actualCount,
        remaining: newState.prizes.remaining,
      },
    }],
  };
}

/**
 * Look at prize cards
 */
async function executeLookAtPrizes(
  state: GameState,
  count: number,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const available = state.prizes.remaining;

  if (available === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No prize cards to look at',
        data: {},
      }],
    };
  }

  const actualCount = Math.min(count, available);

  // In a real game, this would reveal actual prize cards
  // For now, create placeholder known cards if not already known
  const knownPrizes = state.prizes.knownCards || [];
  const revealedCards = knownPrizes.slice(0, actualCount);

  const messages: ExecutionMessage[] = [{
    type: 'info',
    message: `Looked at ${actualCount} prize card(s)`,
    data: {
      count: actualCount,
      knownCards: revealedCards.map(c => c.name),
    },
  }];

  return { state, messages };
}

/**
 * Swap a prize card with a card from hand
 */
async function executeSwapPrize(
  state: GameState,
  context: ExecutionContext
): Promise<ExecutionResult> {
  if (state.hand.length === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No cards in hand to swap with prize',
        data: {},
      }],
    };
  }

  if (state.prizes.remaining === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No prize cards to swap',
        data: {},
      }],
    };
  }

  // Request which hand card to swap
  const handChoice: ChoiceRequest = {
    type: 'select-card',
    player: 'self',
    options: state.hand.map(card => ({
      id: card.id,
      label: card.name,
      data: card,
    })),
    minSelections: 1,
    maxSelections: 1,
    message: 'Select a card from hand to swap with a prize card',
  };

  const handIndices = await context.chooseForSelf(handChoice);
  const cardFromHand = state.hand[handIndices[0]];

  // If we have known prize cards, let them choose which one
  const knownPrizes = state.prizes.knownCards || [];

  let cardFromPrize: CardInstance | undefined;
  if (knownPrizes.length > 0) {
    const prizeChoice: ChoiceRequest = {
      type: 'select-card',
      player: 'self',
      options: knownPrizes.map(card => ({
        id: card.id,
        label: card.name,
        data: card,
      })),
      minSelections: 1,
      maxSelections: 1,
      message: 'Select a prize card to swap',
    };

    const prizeIndices = await context.chooseForSelf(prizeChoice);
    cardFromPrize = knownPrizes[prizeIndices[0]];
  }

  // Remove card from hand
  const newHand = state.hand.filter(c => c.id !== cardFromHand.id);

  // Add prize card to hand (if known)
  const finalHand = cardFromPrize ? [...newHand, cardFromPrize] : newHand;

  // Update known prizes
  let newKnownPrizes = knownPrizes;
  if (cardFromPrize) {
    newKnownPrizes = knownPrizes.filter(c => c.id !== cardFromPrize!.id);
    newKnownPrizes.push(cardFromHand);
  }

  const newState: GameState = {
    ...state,
    hand: finalHand,
    prizes: {
      ...state.prizes,
      knownCards: newKnownPrizes.length > 0 ? newKnownPrizes : undefined,
    },
  };

  return {
    state: newState,
    messages: [{
      type: 'info',
      message: cardFromPrize
        ? `Swapped ${cardFromHand.name} with ${cardFromPrize.name} from prizes`
        : `Swapped ${cardFromHand.name} with a prize card`,
      data: {
        fromHand: cardFromHand.name,
        fromPrize: cardFromPrize?.name,
      },
    }],
  };
}

/**
 * Put a prize card back (after looking)
 */
async function executePutBackPrize(
  state: GameState,
  context: ExecutionContext
): Promise<ExecutionResult> {
  // This would typically be used after looking at prizes
  // For now, just acknowledge the action
  return {
    state,
    messages: [{
      type: 'info',
      message: 'Put prize card(s) back',
      data: {},
    }],
  };
}

export const prizeExecutor = {
  effectType: EffectType.Prize,
  execute: executePrize,
};
