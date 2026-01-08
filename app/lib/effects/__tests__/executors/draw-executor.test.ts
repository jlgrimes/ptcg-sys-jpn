import { executeDraw } from '../../executors/draw-executor';
import { createTestContext } from '../../executors/types';
import { EffectType, DrawEffect } from '../../types';
import { GameState, CardInstance } from '../../../notation/training-format';

function createTestGameState(deckSize: number = 30, knownCards?: CardInstance[]): GameState {
  return {
    hand: [
      { id: 'h1', cardId: '001', name: 'Card 1', type: 'trainer' },
    ],
    deck: {
      size: deckSize,
      knownCards,
    },
    discard: [],
    prizes: { remaining: 4 },
    active: {
      card: { id: 'p-active', cardId: '001', name: 'Pikachu', type: 'pokemon', subtype: 'basic' },
      hp: 60,
      maxHp: 60,
      damage: 0,
      status: null,
      attachedEnergy: [],
      attachedTools: [],
      abilities: [],
      canRetreat: true,
      retreatCost: 1,
    },
    bench: [null, null, null, null, null],
    opponent: {
      handSize: 5,
      deckSize: 30,
      discard: [],
      prizes: { remaining: 4 },
      active: {
        card: { id: 'o-active', cardId: '003', name: 'Charmander', type: 'pokemon', subtype: 'basic' },
        hp: 70,
        maxHp: 70,
        damage: 0,
        status: null,
        attachedEnergy: [],
        attachedTools: [],
        abilities: [],
        canRetreat: true,
        retreatCost: 1,
      },
      bench: [null, null, null, null, null],
    },
    stadium: null,
    turnNumber: 5,
    isFirstTurn: false,
    canPlaySupporter: true,
    canAttack: true,
    canRetreat: true,
    energyAttachedThisTurn: false,
  };
}

describe('DrawExecutor', () => {
  const context = createTestContext(12345);

  it('should draw cards from deck', async () => {
    const state = createTestGameState(30);
    const effect: DrawEffect = {
      type: EffectType.Draw,
      value: 3,
    };

    const result = await executeDraw(state, effect, context);

    expect(result.state.hand.length).toBe(4); // 1 original + 3 drawn
    expect(result.state.deck.size).toBe(27); // 30 - 3
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].type).toBe('draw');
  });

  it('should draw known cards when available', async () => {
    const knownCards: CardInstance[] = [
      { id: 'k1', cardId: '010', name: 'Known Card 1', type: 'trainer' },
      { id: 'k2', cardId: '011', name: 'Known Card 2', type: 'energy' },
      { id: 'k3', cardId: '012', name: 'Known Card 3', type: 'pokemon' },
    ];
    const state = createTestGameState(30, knownCards);
    const effect: DrawEffect = {
      type: EffectType.Draw,
      value: 2,
    };

    const result = await executeDraw(state, effect, context);

    expect(result.state.hand.length).toBe(3);
    expect(result.state.hand.some(c => c.name === 'Known Card 1')).toBe(true);
    expect(result.state.hand.some(c => c.name === 'Known Card 2')).toBe(true);
    // Known cards should be removed from deck
    expect(result.state.deck.knownCards?.length).toBe(1);
  });

  it('should limit draw to available deck size', async () => {
    const state = createTestGameState(2); // Only 2 cards in deck
    const effect: DrawEffect = {
      type: EffectType.Draw,
      value: 5, // Want to draw 5
    };

    const result = await executeDraw(state, effect, context);

    expect(result.state.hand.length).toBe(3); // 1 original + 2 drawn
    expect(result.state.deck.size).toBe(0);
    // Should have warning message about limited draw
    expect(result.messages.length).toBe(2);
    expect(result.messages.some(m => m.type === 'info')).toBe(true);
  });

  it('should handle empty deck', async () => {
    const state = createTestGameState(0); // Empty deck
    const effect: DrawEffect = {
      type: EffectType.Draw,
      value: 3,
    };

    const result = await executeDraw(state, effect, context);

    expect(result.state.hand.length).toBe(1); // No change
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].type).toBe('info');
  });

  it('should handle zero draw', async () => {
    const state = createTestGameState(30);
    const effect: DrawEffect = {
      type: EffectType.Draw,
      value: 0,
    };

    const result = await executeDraw(state, effect, context);

    expect(result.state.hand.length).toBe(1); // No change
    expect(result.messages).toHaveLength(0);
  });
});
