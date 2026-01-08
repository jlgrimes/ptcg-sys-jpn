import { executeHeal } from '../../executors/heal-executor';
import { createTestContext } from '../../executors/types';
import { EffectType, HealEffect } from '../../types';
import { GameState } from '../../../notation/training-format';

function createTestGameState(): GameState {
  return {
    hand: [],
    deck: { size: 30 },
    discard: [],
    prizes: { remaining: 4 },
    active: {
      card: { id: 'p-active', cardId: '001', name: 'Pikachu', type: 'pokemon', subtype: 'basic' },
      hp: 30, // Damaged
      maxHp: 60,
      damage: 30,
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
        hp: 40,
        maxHp: 70,
        damage: 30,
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

describe('HealExecutor', () => {
  const context = createTestContext(12345);

  it('should heal HP from self active Pokemon', async () => {
    const state = createTestGameState();
    const effect: HealEffect = {
      type: EffectType.Heal,
      value: 20,
      unit: 'hp',
      targets: [{
        type: 'pokemon',
        player: 'self',
        location: { type: 'active' },
      }],
    };

    const result = await executeHeal(state, effect, context);

    expect(result.state.active?.damage).toBe(10); // 30 - 20
    expect(result.state.active?.hp).toBe(50); // 60 - 10
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].type).toBe('heal');
  });

  it('should heal by removing damage counters', async () => {
    const state = createTestGameState();
    const effect: HealEffect = {
      type: EffectType.Heal,
      value: 2, // 2 damage counters = 20 HP
      unit: 'damage-counters',
      targets: [{
        type: 'pokemon',
        player: 'self',
        location: { type: 'active' },
      }],
    };

    const result = await executeHeal(state, effect, context);

    expect(result.state.active?.damage).toBe(10); // 30 - 20
  });

  it('should not heal more than current damage', async () => {
    const state = createTestGameState();
    const effect: HealEffect = {
      type: EffectType.Heal,
      value: 100, // More than current damage (30)
      unit: 'hp',
      targets: [{
        type: 'pokemon',
        player: 'self',
        location: { type: 'active' },
      }],
    };

    const result = await executeHeal(state, effect, context);

    expect(result.state.active?.damage).toBe(0);
    expect(result.state.active?.hp).toBe(60); // Max HP
  });

  it('should not heal Pokemon at full HP', async () => {
    const state = createTestGameState();
    state.active!.damage = 0;
    state.active!.hp = 60;

    const effect: HealEffect = {
      type: EffectType.Heal,
      value: 20,
      unit: 'hp',
      targets: [{
        type: 'pokemon',
        player: 'self',
        location: { type: 'active' },
      }],
    };

    const result = await executeHeal(state, effect, context);

    expect(result.state.active?.damage).toBe(0);
    expect(result.messages).toHaveLength(0); // No healing message
  });

  it('should heal opponent Pokemon when targeted', async () => {
    const state = createTestGameState();
    const effect: HealEffect = {
      type: EffectType.Heal,
      value: 20,
      unit: 'hp',
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    };

    const result = await executeHeal(state, effect, context);

    expect(result.state.opponent.active?.damage).toBe(10); // 30 - 20
  });
});
