import { executeDiscard } from '../../executors/discard-executor';
import { createTestContext, ChoiceCallback, ChoiceRequest } from '../../executors/types';
import { EffectType, DiscardEffect } from '../../types';
import { GameState } from '../../../notation/training-format';

function createTestGameState(): GameState {
  return {
    hand: [
      { id: 'h1', cardId: '001', name: 'Card 1', type: 'trainer', subtype: 'item' },
      { id: 'h2', cardId: '002', name: 'Card 2', type: 'energy', subtype: 'basic' },
      { id: 'h3', cardId: '003', name: 'Card 3', type: 'pokemon', subtype: 'basic' },
      { id: 'h4', cardId: '004', name: 'Card 4', type: 'trainer', subtype: 'supporter' },
    ],
    deck: { size: 30 },
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

describe('DiscardExecutor', () => {
  it('should discard cards from hand with player choice', async () => {
    const state = createTestGameState();

    // Mock choice callback that selects first card
    const mockChoose: ChoiceCallback = async (request: ChoiceRequest) => [0];
    const context = {
      ...createTestContext(12345),
      chooseForSelf: mockChoose,
    };

    const effect: DiscardEffect = {
      type: EffectType.Discard,
      value: 1,
      targets: [{
        type: 'card',
        player: 'self',
        location: { type: 'hand' },
        count: 1,
      }],
    };

    const result = await executeDiscard(state, effect, context);

    expect(result.state.hand.length).toBe(3); // 4 - 1
    expect(result.state.discard.length).toBe(1);
    expect(result.state.discard[0].name).toBe('Card 1');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].type).toBe('discard');
  });

  it('should discard multiple cards', async () => {
    const state = createTestGameState();

    // Mock choice callback that selects first two cards
    const mockChoose: ChoiceCallback = async (request: ChoiceRequest) => [0, 1];
    const context = {
      ...createTestContext(12345),
      chooseForSelf: mockChoose,
    };

    const effect: DiscardEffect = {
      type: EffectType.Discard,
      value: 2,
      targets: [{
        type: 'card',
        player: 'self',
        location: { type: 'hand' },
        count: 2,
      }],
    };

    const result = await executeDiscard(state, effect, context);

    expect(result.state.hand.length).toBe(2);
    expect(result.state.discard.length).toBe(2);
  });

  it('should discard all cards when selection is "all"', async () => {
    const state = createTestGameState();
    const context = createTestContext(12345);

    const effect: DiscardEffect = {
      type: EffectType.Discard,
      selection: 'all',
      targets: [{
        type: 'card',
        player: 'self',
        location: { type: 'hand' },
        count: 'all',
      }],
    };

    const result = await executeDiscard(state, effect, context);

    expect(result.state.hand.length).toBe(0);
    expect(result.state.discard.length).toBe(4);
  });

  it('should discard random cards when selection is "random"', async () => {
    const state = createTestGameState();
    const context = createTestContext(12345); // Seeded for determinism

    const effect: DiscardEffect = {
      type: EffectType.Discard,
      selection: 'random',
      value: 2,
      targets: [{
        type: 'card',
        player: 'self',
        location: { type: 'hand' },
        count: 2,
      }],
    };

    const result = await executeDiscard(state, effect, context);

    expect(result.state.hand.length).toBe(2);
    expect(result.state.discard.length).toBe(2);
  });

  it('should handle empty hand gracefully', async () => {
    const state = createTestGameState();
    state.hand = [];
    const context = createTestContext(12345);

    const effect: DiscardEffect = {
      type: EffectType.Discard,
      value: 1,
      targets: [{
        type: 'card',
        player: 'self',
        location: { type: 'hand' },
        count: 1,
      }],
    };

    const result = await executeDiscard(state, effect, context);

    expect(result.state.hand.length).toBe(0);
    expect(result.state.discard.length).toBe(0);
    expect(result.messages.some(m => m.type === 'info')).toBe(true);
  });

  it('should respect isUpTo flag allowing fewer selections', async () => {
    const state = createTestGameState();

    // Mock choice callback that selects no cards
    const mockChoose: ChoiceCallback = async () => [];
    const context = {
      ...createTestContext(12345),
      chooseForSelf: mockChoose,
    };

    const effect: DiscardEffect = {
      type: EffectType.Discard,
      value: 2,
      isUpTo: true,
      targets: [{
        type: 'card',
        player: 'self',
        location: { type: 'hand' },
        count: 2,
      }],
    };

    const result = await executeDiscard(state, effect, context);

    // With isUpTo, selecting 0 is valid
    expect(result.state.hand.length).toBe(4);
    expect(result.state.discard.length).toBe(0);
  });
});
