import { executeEffect, executeEffects, createTestContext } from '../../executors';
import { EffectType, Effect } from '../../types';
import { GameState } from '../../../notation/training-format';
import { ChoiceCallback, SeededRNG, ExecutionContext } from '../../executors/types';

/**
 * Mock RNG that returns predetermined coin flip results
 */
class MockRNG implements SeededRNG {
  private coinResults: boolean[];
  private coinIndex = 0;

  constructor(coinResults: boolean[]) {
    this.coinResults = coinResults;
  }

  random(): number {
    return 0.5;
  }

  flipCoin(): boolean {
    const result = this.coinResults[this.coinIndex] ?? true;
    this.coinIndex++;
    return result;
  }

  flipCoins(count: number): boolean[] {
    return Array.from({ length: count }, () => this.flipCoin());
  }

  shuffle<T>(array: T[]): T[] {
    return [...array];
  }

  pickRandom<T>(array: T[], count: number): T[] {
    return array.slice(0, count);
  }
}

function createMockContext(coinResults: boolean[]): ExecutionContext {
  const base = createTestContext(12345);
  return {
    ...base,
    rng: new MockRNG(coinResults),
  };
}

function createTestGameState(): GameState {
  return {
    hand: [
      { id: 'h1', cardId: '001', name: 'Card 1', type: 'trainer', subtype: 'item' },
      { id: 'h2', cardId: '002', name: 'Card 2', type: 'energy', subtype: 'basic' },
      { id: 'h3', cardId: '003', name: 'Card 3', type: 'pokemon', subtype: 'basic' },
    ],
    deck: { size: 30 },
    discard: [],
    prizes: { remaining: 4 },
    active: {
      card: { id: 'p-active', cardId: '001', name: 'Pikachu', type: 'pokemon', subtype: 'basic' },
      hp: 40,
      maxHp: 60,
      damage: 20,
      status: null,
      attachedEnergy: [
        { id: 'e1', cardId: '010', name: 'Lightning Energy', type: 'energy', subtype: 'basic' },
      ],
      attachedTools: [],
      abilities: [],
      canRetreat: true,
      retreatCost: 1,
    },
    bench: [
      {
        card: { id: 'p-bench-1', cardId: '002', name: 'Eevee', type: 'pokemon', subtype: 'basic' },
        hp: 50,
        maxHp: 50,
        damage: 0,
        status: null,
        attachedEnergy: [],
        attachedTools: [],
        abilities: [],
        canRetreat: true,
        retreatCost: 1,
      },
      null, null, null, null,
    ],
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
      bench: [
        {
          card: { id: 'o-bench-1', cardId: '004', name: 'Squirtle', type: 'pokemon', subtype: 'basic' },
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
        null, null, null, null,
      ],
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

describe('Effect Execution Integration', () => {
  describe('executeEffects - multiple effects in sequence', () => {
    it('should execute damage and status in sequence', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const effects: Effect[] = [
        {
          type: EffectType.Damage,
          value: 30,
          targets: [{
            type: 'pokemon',
            player: 'opponent',
            location: { type: 'active' },
          }],
        },
        {
          type: EffectType.Status,
          status: 'paralyzed',
          targets: [{
            type: 'pokemon',
            player: 'opponent',
            location: { type: 'active' },
          }],
        },
      ];

      const result = await executeEffects(state, effects, context);

      expect(result.state.opponent.active?.damage).toBe(30);
      expect(result.state.opponent.active?.status?.type).toBe('paralyzed');
      expect(result.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should execute draw and discard in sequence', async () => {
      const state = createTestGameState();
      state.deck.knownCards = [
        { id: 'k1', cardId: '100', name: 'Drawn Card', type: 'trainer' },
      ];

      const mockChoose: ChoiceCallback = async () => [0];
      const context = {
        ...createTestContext(12345),
        chooseForSelf: mockChoose,
      };

      const effects: Effect[] = [
        { type: EffectType.Draw, value: 1 },
        {
          type: EffectType.Discard,
          value: 1,
          targets: [{
            type: 'card',
            player: 'self',
            location: { type: 'hand' },
            count: 1,
          }],
        },
      ];

      const result = await executeEffects(state, effects, context);

      // Drew 1 card, discarded 1 card, net same hand size
      // Original: 3, +1 draw, -1 discard = 3
      expect(result.state.hand.length).toBe(3);
      expect(result.state.discard.length).toBe(1);
    });
  });

  describe('conditional effects', () => {
    it('should execute success effects when condition passes (heads)', async () => {
      const state = createTestGameState();
      const context = createMockContext([true]); // Heads

      const effect: Effect = {
        type: EffectType.Damage,
        value: 0, // No base damage
        conditions: [{
          type: 'coin-flip',
          value: 1,
          onSuccess: [{
            type: EffectType.Damage,
            value: 50,
            targets: [{
              type: 'pokemon',
              player: 'opponent',
              location: { type: 'active' },
            }],
          }],
        }],
      };

      const result = await executeEffect(state, effect, context);

      // Damage should be applied from success effects
      expect(result.state.opponent.active?.damage).toBe(50);
    });

    it('should execute failure effects when condition fails (tails)', async () => {
      const state = createTestGameState();
      const context = createMockContext([false]); // Tails

      const effect: Effect = {
        type: EffectType.Damage,
        value: 0,
        conditions: [{
          type: 'coin-flip',
          value: 1,
          onSuccess: [{
            type: EffectType.Damage,
            value: 50,
            targets: [{
              type: 'pokemon',
              player: 'opponent',
              location: { type: 'active' },
            }],
          }],
          onFailure: [{
            type: EffectType.Damage,
            value: 20, // Less damage on tails
            targets: [{
              type: 'pokemon',
              player: 'opponent',
              location: { type: 'active' },
            }],
          }],
        }],
      };

      const result = await executeEffect(state, effect, context);

      // Only failure damage should be applied
      expect(result.state.opponent.active?.damage).toBe(20);
    });
  });

  describe('knockout chain', () => {
    it('should knockout and take prize', async () => {
      const state = createTestGameState();
      state.opponent.active!.hp = 30;
      state.opponent.active!.maxHp = 70;
      state.opponent.active!.damage = 40;

      const context = createTestContext(12345);

      const effect: Effect = {
        type: EffectType.Damage,
        value: 40, // This will KO (40 + 40 = 80 > 70)
        targets: [{
          type: 'pokemon',
          player: 'opponent',
          location: { type: 'active' },
        }],
      };

      const result = await executeEffect(state, effect, context);

      expect(result.state.opponent.active).toBeNull();
      expect(result.state.prizes.remaining).toBe(3); // Took a prize
    });
  });

  describe('heal after damage', () => {
    it('should heal damage taken in same turn', async () => {
      const state = createTestGameState();
      state.active!.damage = 0;
      state.active!.hp = 60;

      const context = createTestContext(12345);

      const effects: Effect[] = [
        {
          type: EffectType.Damage,
          value: 30,
          targets: [{
            type: 'pokemon',
            player: 'self',
            location: { type: 'active' },
          }],
        },
        {
          type: EffectType.Heal,
          value: 20,
          unit: 'hp',
          targets: [{
            type: 'pokemon',
            player: 'self',
            location: { type: 'active' },
          }],
        },
      ];

      const result = await executeEffects(state, effects, context);

      expect(result.state.active?.damage).toBe(10); // 30 - 20
      expect(result.state.active?.hp).toBe(50); // 60 - 10
    });
  });

  describe('effect type coverage', () => {
    it('should handle unknown effect type gracefully', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const effect: Effect = {
        type: 'unknown-type' as EffectType,
        value: 10,
      };

      const result = await executeEffect(state, effect, context);

      // Should not throw, just return unchanged state with message
      expect(result.messages.some(m => m.message.includes('Unknown'))).toBe(true);
    });
  });
});
