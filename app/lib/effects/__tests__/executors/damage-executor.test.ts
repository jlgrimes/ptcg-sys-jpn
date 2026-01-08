import { executeDamage } from '../../executors/damage-executor';
import { createTestContext } from '../../executors/types';
import { EffectType, DamageEffect } from '../../types';
import { GameState } from '../../../notation/training-format';

// Helper to create a simple game state for testing
function createTestGameState(): GameState {
  return {
    hand: [],
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

describe('DamageExecutor', () => {
  const context = createTestContext(12345);

  it('should apply damage to opponent active Pokemon', async () => {
    const state = createTestGameState();
    const effect: DamageEffect = {
      type: EffectType.Damage,
      value: 30,
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeDamage(state, effect, context);

    expect(result.state.opponent.active?.damage).toBe(30);
    expect(result.state.opponent.active?.hp).toBe(40); // 70 - 30
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].type).toBe('damage');
  });

  it('should apply damage to self active Pokemon', async () => {
    const state = createTestGameState();
    const effect: DamageEffect = {
      type: EffectType.Damage,
      value: 20,
      targets: [{
        type: 'pokemon',
        player: 'self',
        location: { type: 'active' },
      }],
    };

    const result = await executeDamage(state, effect, context);

    expect(result.state.active?.damage).toBe(20);
    expect(result.state.active?.hp).toBe(40); // 60 - 20
  });

  it('should handle knockout when damage exceeds HP', async () => {
    const state = createTestGameState();
    const effect: DamageEffect = {
      type: EffectType.Damage,
      value: 100, // More than 70 HP
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeDamage(state, effect, context);

    // Pokemon should be knocked out (null)
    expect(result.state.opponent.active).toBeNull();
    // Player should take a prize
    expect(result.state.prizes.remaining).toBe(3); // 4 - 1
    expect(result.messages.some(m => m.type === 'knockout')).toBe(true);
  });

  it('should handle damage to Pokemon with existing damage', async () => {
    const state = createTestGameState();
    state.opponent.active!.damage = 30;
    state.opponent.active!.hp = 40;

    const effect: DamageEffect = {
      type: EffectType.Damage,
      value: 20,
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeDamage(state, effect, context);

    expect(result.state.opponent.active?.damage).toBe(50); // 30 + 20
    expect(result.state.opponent.active?.hp).toBe(20); // 70 - 50
  });

  it('should return unchanged state for zero damage', async () => {
    const state = createTestGameState();
    const effect: DamageEffect = {
      type: EffectType.Damage,
      value: 0,
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeDamage(state, effect, context);

    expect(result.state.opponent.active?.damage).toBe(0);
    expect(result.messages).toHaveLength(0);
  });

  it('should use simple target when targets array is not provided', async () => {
    const state = createTestGameState();
    const effect: DamageEffect = {
      type: EffectType.Damage,
      value: 30,
      target: 'opponent', // Simple target
    };

    const result = await executeDamage(state, effect, context);

    expect(result.state.opponent.active?.damage).toBe(30);
  });
});
