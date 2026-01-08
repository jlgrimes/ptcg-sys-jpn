/**
 * Draw executor - draws cards from deck to hand
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, DrawEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';
import { drawCards } from './utils/state-helpers';

/**
 * Execute a draw effect
 */
export async function executeDraw(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const drawEffect = effect as DrawEffect;
  const count = drawEffect.value || 0;

  if (count <= 0) {
    return { state, messages: [] };
  }

  // Check if we have enough cards in deck
  const availableCards = state.deck.size;
  if (availableCards === 0) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'No cards left in deck to draw',
        data: { requestedDraw: count },
      }],
    };
  }

  // Draw cards (limited by deck size)
  const actualDraw = Math.min(count, availableCards);
  const [newState, drawnCards] = drawCards(state, actualDraw);

  const messages: ExecutionMessage[] = [{
    type: 'draw',
    message: `Drew ${actualDraw} card(s)`,
    data: {
      count: actualDraw,
      cards: drawnCards.map(c => c.name),
      deckRemaining: newState.deck.size,
    },
  }];

  // Warn if we tried to draw more than available
  if (count > actualDraw) {
    messages.push({
      type: 'info',
      message: `Could only draw ${actualDraw} cards (deck had ${availableCards} cards)`,
      data: { requestedDraw: count, actualDraw },
    });
  }

  return { state: newState, messages };
}

export const drawExecutor = {
  effectType: EffectType.Draw,
  execute: executeDraw,
};
