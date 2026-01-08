import { evaluateCondition, evaluateConditions } from '../../executors/utils/condition-evaluator';
import { createTestContext, SeededRNG, ExecutionContext } from '../../executors/types';
import { Condition, EffectType } from '../../types';
import { GameState } from '../../../notation/training-format';

/**
 * Mock RNG that returns predetermined results
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
      { id: 'h1', cardId: '001', name: 'Card 1', type: 'trainer' },
      { id: 'h2', cardId: '002', name: 'Card 2', type: 'energy' },
      { id: 'h3', cardId: '003', name: 'Card 3', type: 'pokemon' },
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
        { id: 'e2', cardId: '010', name: 'Lightning Energy', type: 'energy', subtype: 'basic' },
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
        status: { type: 'poisoned' },
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

describe('ConditionEvaluator', () => {
  describe('coin-flip condition', () => {
    it('should pass on heads', async () => {
      const state = createTestGameState();
      const context = createMockContext([true]); // Heads

      const condition: Condition = {
        type: 'coin-flip',
        value: 1,
        onSuccess: [{ type: EffectType.Damage, value: 30 }],
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true);
      expect(result.successEffects).toBeDefined();
      expect(result.messages.some(m => m.message.includes('Heads'))).toBe(true);
    });

    it('should fail on tails', async () => {
      const state = createTestGameState();
      const context = createMockContext([false]); // Tails

      const condition: Condition = {
        type: 'coin-flip',
        value: 1,
        onFailure: [{ type: EffectType.MoveFailure }],
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(false);
      expect(result.failureEffects).toBeDefined();
      expect(result.messages.some(m => m.message.includes('Tails'))).toBe(true);
    });

    it('should handle multiple coin flips', async () => {
      const state = createTestGameState();
      const context = createMockContext([true, false, true]); // 2 heads, 1 tails

      const condition: Condition = {
        type: 'coin-flip',
        value: 3, // Flip 3 coins
        values: [2], // Need at least 2 heads
        onSuccess: [{ type: EffectType.Damage, value: 60 }],
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true); // 2 heads >= 2 required
    });
  });

  describe('card-count condition', () => {
    it('should check hand size', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'card-count',
        value: 3, // Exact hand size
        comparison: 'equal',
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true);
    });

    it('should fail when comparison does not match', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'card-count',
        value: 5,
        comparison: 'equal',
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(false);
    });

    it('should handle greater-than comparison', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'card-count',
        value: 2,
        comparison: 'greater-than',
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true); // 3 > 2
    });
  });

  describe('has-energy condition', () => {
    it('should pass when Pokemon has energy', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'has-energy',
        value: 2,
        target: {
          type: 'pokemon',
          player: 'self',
          location: { type: 'active' },
        },
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true);
    });

    it('should fail when Pokemon lacks required energy', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'has-energy',
        value: 3, // Requires 3, only has 2
        target: {
          type: 'pokemon',
          player: 'self',
          location: { type: 'active' },
        },
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(false);
    });
  });

  describe('has-damage condition', () => {
    it('should pass when Pokemon has damage', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'has-damage',
        target: {
          type: 'pokemon',
          player: 'self',
          location: { type: 'active' },
        },
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true); // Active has 20 damage
    });

    it('should fail when Pokemon has no damage', async () => {
      const state = createTestGameState();
      state.active!.damage = 0;
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'has-damage',
        target: {
          type: 'pokemon',
          player: 'self',
          location: { type: 'active' },
        },
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(false);
    });
  });

  describe('prize-count condition', () => {
    it('should check prize count', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'prize-count',
        value: 4,
        comparison: 'equal',
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true);
    });
  });

  describe('bench-count condition', () => {
    it('should count bench Pokemon', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'bench-count',
        value: 1,
        comparison: 'equal',
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true); // Has 1 bench Pokemon
    });
  });

  describe('status condition', () => {
    it('should pass when opponent has status', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const condition: Condition = {
        type: 'status',
        target: {
          type: 'pokemon',
          player: 'opponent',
          location: { type: 'active' },
        },
      };

      const result = await evaluateCondition(state, condition, context);

      expect(result.passed).toBe(true); // Opponent is poisoned
    });
  });

  describe('multiple conditions (AND logic)', () => {
    it('should pass when all conditions are met', async () => {
      const state = createTestGameState();
      const context = createTestContext(12345);

      const conditions: Condition[] = [
        { type: 'has-damage' },
        { type: 'has-energy', value: 1 },
      ];

      const result = await evaluateConditions(state, conditions, context);

      expect(result.passed).toBe(true);
    });

    it('should fail when any condition fails', async () => {
      const state = createTestGameState();
      state.active!.damage = 0; // Remove damage
      const context = createTestContext(12345);

      const conditions: Condition[] = [
        { type: 'has-damage' }, // Will fail
        { type: 'has-energy', value: 1 },
      ];

      const result = await evaluateConditions(state, conditions, context);

      expect(result.passed).toBe(false);
    });
  });
});
