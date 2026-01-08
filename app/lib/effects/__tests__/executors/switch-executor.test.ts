import { executeSwitch } from '../../executors/switch-executor';
import { createTestContext, ChoiceCallback, ChoiceRequest } from '../../executors/types';
import { EffectType, SwitchEffect } from '../../types';
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
      status: { type: 'paralyzed', turnsRemaining: 1 }, // Has status
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
      {
        card: { id: 'p-bench-2', cardId: '003', name: 'Bulbasaur', type: 'pokemon', subtype: 'basic' },
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
      null, null, null,
    ],
    opponent: {
      handSize: 5,
      deckSize: 30,
      discard: [],
      prizes: { remaining: 4 },
      active: {
        card: { id: 'o-active', cardId: '004', name: 'Charmander', type: 'pokemon', subtype: 'basic' },
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
          card: { id: 'o-bench-1', cardId: '005', name: 'Squirtle', type: 'pokemon', subtype: 'basic' },
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

describe('SwitchExecutor', () => {
  it('should switch self active with bench Pokemon', async () => {
    const state = createTestGameState();

    // Mock choice callback that selects first bench Pokemon
    const mockChoose: ChoiceCallback = async () => [0];
    const context = {
      ...createTestContext(12345),
      chooseForSelf: mockChoose,
    };

    const effect: SwitchEffect = {
      type: EffectType.Switch,
      target: 'self',
    };

    const result = await executeSwitch(state, effect, context);

    // Eevee should now be active
    expect(result.state.active?.card.name).toBe('Eevee');
    // Pikachu should be on bench at index 0
    expect(result.state.bench[0]?.card.name).toBe('Pikachu');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].type).toBe('switch');
  });

  it('should remove status when retreating', async () => {
    const state = createTestGameState();

    const mockChoose: ChoiceCallback = async () => [0];
    const context = {
      ...createTestContext(12345),
      chooseForSelf: mockChoose,
    };

    const effect: SwitchEffect = {
      type: EffectType.Switch,
      target: 'self',
    };

    const result = await executeSwitch(state, effect, context);

    // The old active (Pikachu, now on bench) should have status removed
    expect(result.state.bench[0]?.status).toBeNull();
  });

  it('should switch opponent Pokemon when targeted', async () => {
    const state = createTestGameState();

    const mockChoose: ChoiceCallback = async () => [0];
    const context = {
      ...createTestContext(12345),
      chooseForOpponent: mockChoose,
    };

    const effect: SwitchEffect = {
      type: EffectType.Switch,
      target: 'opponent',
    };

    const result = await executeSwitch(state, effect, context);

    expect(result.state.opponent.active?.card.name).toBe('Squirtle');
    expect(result.state.opponent.bench[0]?.card.name).toBe('Charmander');
  });

  it('should handle no bench Pokemon', async () => {
    const state = createTestGameState();
    state.bench = [null, null, null, null, null]; // No bench Pokemon
    const context = createTestContext(12345);

    const effect: SwitchEffect = {
      type: EffectType.Switch,
      target: 'self',
    };

    const result = await executeSwitch(state, effect, context);

    // Should not change state
    expect(result.state.active?.card.name).toBe('Pikachu');
    expect(result.messages.some(m => m.type === 'info')).toBe(true);
  });

  it('should auto-select when only one bench Pokemon exists', async () => {
    const state = createTestGameState();
    state.bench = [
      state.bench[0], // Keep only Eevee
      null, null, null, null,
    ];
    const context = createTestContext(12345);

    const effect: SwitchEffect = {
      type: EffectType.Switch,
      target: 'self',
    };

    const result = await executeSwitch(state, effect, context);

    // Should auto-select Eevee
    expect(result.state.active?.card.name).toBe('Eevee');
  });

  it('should handle random selection', async () => {
    const state = createTestGameState();
    const context = createTestContext(12345); // Seeded RNG

    const effect: SwitchEffect = {
      type: EffectType.Switch,
      target: 'self',
      selection: 'random',
    };

    const result = await executeSwitch(state, effect, context);

    // Should have switched to some bench Pokemon
    expect(result.state.active?.card.name).not.toBe('Pikachu');
    expect(['Eevee', 'Bulbasaur']).toContain(result.state.active?.card.name);
  });
});
