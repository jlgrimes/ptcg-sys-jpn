import { executeStatus } from '../../executors/status-executor';
import { createTestContext } from '../../executors/types';
import { EffectType, StatusEffect } from '../../types';
import { GameState } from '../../../notation/training-format';

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

describe('StatusExecutor', () => {
  const context = createTestContext(12345);

  it('should apply paralysis to opponent active Pokemon', async () => {
    const state = createTestGameState();
    const effect: StatusEffect = {
      type: EffectType.Status,
      status: 'paralyzed',
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeStatus(state, effect, context);

    expect(result.state.opponent.active?.status?.type).toBe('paralyzed');
    expect(result.state.opponent.active?.status?.turnsRemaining).toBe(1);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].type).toBe('status');
  });

  it('should apply sleep to opponent', async () => {
    const state = createTestGameState();
    const effect: StatusEffect = {
      type: EffectType.Status,
      status: 'asleep',
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeStatus(state, effect, context);

    expect(result.state.opponent.active?.status?.type).toBe('asleep');
    expect(result.state.opponent.active?.status?.turnsRemaining).toBeUndefined();
  });

  it('should apply confusion', async () => {
    const state = createTestGameState();
    const effect: StatusEffect = {
      type: EffectType.Status,
      status: 'confused',
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeStatus(state, effect, context);

    expect(result.state.opponent.active?.status?.type).toBe('confused');
  });

  it('should apply burn', async () => {
    const state = createTestGameState();
    const effect: StatusEffect = {
      type: EffectType.Status,
      status: 'burned',
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeStatus(state, effect, context);

    expect(result.state.opponent.active?.status?.type).toBe('burned');
  });

  it('should apply poison', async () => {
    const state = createTestGameState();
    const effect: StatusEffect = {
      type: EffectType.Status,
      status: 'poisoned',
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeStatus(state, effect, context);

    expect(result.state.opponent.active?.status?.type).toBe('poisoned');
  });

  it('should not apply paralysis/sleep/confusion to bench Pokemon', async () => {
    const state = createTestGameState();
    const effect: StatusEffect = {
      type: EffectType.Status,
      status: 'paralyzed',
      targets: [{
        type: 'pokemon',
        player: 'self',
        location: { type: 'bench' },
        count: 1,
      }],
    };

    const result = await executeStatus(state, effect, context);

    // Bench Pokemon should not be paralyzed
    expect(result.state.bench[0]?.status).toBeNull();
    // Should have info message about inability to paralyze bench Pokemon
    expect(result.messages.some(m => m.type === 'info')).toBe(true);
  });

  it('should replace existing status with new one', async () => {
    const state = createTestGameState();
    state.opponent.active!.status = { type: 'asleep' };

    const effect: StatusEffect = {
      type: EffectType.Status,
      status: 'paralyzed',
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeStatus(state, effect, context);

    expect(result.state.opponent.active?.status?.type).toBe('paralyzed');
  });
});
