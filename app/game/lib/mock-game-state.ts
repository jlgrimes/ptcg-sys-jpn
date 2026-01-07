/**
 * Mock Game State for Testing
 *
 * Provides realistic sample game states for development and testing.
 * Uses card IDs from the pokemon-card.com database.
 */

import {
  GameState,
  CardInstance,
  PokemonState,
  StatusCondition,
} from '@/app/lib/notation/training-format';

/**
 * Create a basic CardInstance
 */
function createCard(
  id: string,
  cardId: string,
  name: string,
  type: 'pokemon' | 'trainer' | 'energy',
  subtype?: string
): CardInstance {
  return { id, cardId, name, type, subtype };
}

/**
 * Create a PokemonState from a CardInstance
 */
function createPokemon(
  card: CardInstance,
  hp: number,
  maxHp: number,
  options: {
    damage?: number;
    status?: StatusCondition | null;
    attachedEnergy?: CardInstance[];
    attachedTools?: CardInstance[];
    retreatCost?: number;
    abilities?: { name: string; used: boolean }[];
  } = {}
): PokemonState {
  return {
    card,
    hp,
    maxHp,
    damage: options.damage ?? 0,
    status: options.status ?? null,
    attachedEnergy: options.attachedEnergy ?? [],
    attachedTools: options.attachedTools ?? [],
    abilities: options.abilities ?? [],
    canRetreat: (options.attachedEnergy?.length ?? 0) >= (options.retreatCost ?? 1),
    retreatCost: options.retreatCost ?? 1,
  };
}

/**
 * Sample mid-game state
 * Player has Pikachu active with 2 energy, opponent has Charizard
 */
export const mockMidGameState: GameState = {
  // Player's perspective
  hand: [
    createCard('p-hand-1', '47001', 'ポケモンいれかえ', 'trainer', 'item'),
    createCard('p-hand-2', '47002', 'ハイパーボール', 'trainer', 'item'),
    createCard('p-hand-3', '47003', 'たね・ピカチュウ', 'pokemon', 'basic'),
    createCard('p-hand-4', '47010', '基本雷エネルギー', 'energy', 'basic'),
    createCard('p-hand-5', '47011', '博士の研究', 'trainer', 'supporter'),
  ],
  deck: { size: 35 },
  discard: [
    createCard('p-disc-1', '47012', '基本雷エネルギー', 'energy', 'basic'),
    createCard('p-disc-2', '47013', 'クイックボール', 'trainer', 'item'),
  ],
  prizes: { remaining: 4 },
  active: createPokemon(
    createCard('p-active', '47100', 'ピカチュウ', 'pokemon', 'basic'),
    60,
    70,
    {
      damage: 10,
      attachedEnergy: [
        createCard('p-e1', '47010', '基本雷エネルギー', 'energy', 'basic'),
        createCard('p-e2', '47010', '基本雷エネルギー', 'energy', 'basic'),
      ],
      retreatCost: 1,
    }
  ),
  bench: [
    createPokemon(
      createCard('p-bench-1', '47101', 'イーブイ', 'pokemon', 'basic'),
      50,
      60,
      { retreatCost: 1 }
    ),
    createPokemon(
      createCard('p-bench-2', '47102', 'コダック', 'pokemon', 'basic'),
      60,
      60,
      {
        attachedEnergy: [
          createCard('p-e3', '47020', '基本水エネルギー', 'energy', 'basic'),
        ],
        retreatCost: 1,
      }
    ),
    null, // Empty bench slot
    null,
    null,
  ],

  // Opponent's observable state
  opponent: {
    handSize: 6,
    deckSize: 28,
    discard: [
      createCard('o-disc-1', '47200', 'ネストボール', 'trainer', 'item'),
      createCard('o-disc-2', '47201', 'ふしぎなアメ', 'trainer', 'item'),
      createCard('o-disc-3', '47202', '基本炎エネルギー', 'energy', 'basic'),
    ],
    prizes: { remaining: 5 },
    active: createPokemon(
      createCard('o-active', '47300', 'リザードン', 'pokemon', 'stage2'),
      150,
      180,
      {
        damage: 30,
        attachedEnergy: [
          createCard('o-e1', '47202', '基本炎エネルギー', 'energy', 'basic'),
          createCard('o-e2', '47202', '基本炎エネルギー', 'energy', 'basic'),
          createCard('o-e3', '47202', '基本炎エネルギー', 'energy', 'basic'),
        ],
        retreatCost: 3,
        abilities: [{ name: 'れんごくしはい', used: false }],
      }
    ),
    bench: [
      createPokemon(
        createCard('o-bench-1', '47301', 'ヒトカゲ', 'pokemon', 'basic'),
        50,
        70,
        { retreatCost: 1 }
      ),
      createPokemon(
        createCard('o-bench-2', '47302', 'ポニータ', 'pokemon', 'basic'),
        60,
        60,
        {
          status: { type: 'asleep' },
          retreatCost: 1,
        }
      ),
      null,
      null,
      null,
    ],
  },

  // Shared state
  stadium: createCard('stadium', '47400', 'ポケモンセンター', 'trainer', 'stadium'),
  turnNumber: 8,
  isFirstTurn: false,
  canPlaySupporter: true,
  canAttack: true,
  canRetreat: true,
  energyAttachedThisTurn: false,
};

/**
 * Early game state - just starting
 */
export const mockEarlyGameState: GameState = {
  hand: [
    createCard('p-hand-1', '47001', 'ポケモンいれかえ', 'trainer', 'item'),
    createCard('p-hand-2', '47002', 'ハイパーボール', 'trainer', 'item'),
    createCard('p-hand-3', '47003', 'ピカチュウ', 'pokemon', 'basic'),
    createCard('p-hand-4', '47010', '基本雷エネルギー', 'energy', 'basic'),
    createCard('p-hand-5', '47010', '基本雷エネルギー', 'energy', 'basic'),
    createCard('p-hand-6', '47011', '博士の研究', 'trainer', 'supporter'),
    createCard('p-hand-7', '47012', 'ネストボール', 'trainer', 'item'),
  ],
  deck: { size: 46 },
  discard: [],
  prizes: { remaining: 6 },
  active: createPokemon(
    createCard('p-active', '47100', 'ピカチュウ', 'pokemon', 'basic'),
    60,
    60,
    { retreatCost: 1 }
  ),
  bench: [null, null, null, null, null],

  opponent: {
    handSize: 7,
    deckSize: 46,
    discard: [],
    prizes: { remaining: 6 },
    active: createPokemon(
      createCard('o-active', '47301', 'ヒトカゲ', 'pokemon', 'basic'),
      70,
      70,
      { retreatCost: 1 }
    ),
    bench: [null, null, null, null, null],
  },

  stadium: null,
  turnNumber: 1,
  isFirstTurn: true,
  canPlaySupporter: true,
  canAttack: false, // Can't attack on first turn going first
  canRetreat: false, // No bench Pokemon
  energyAttachedThisTurn: false,
};

/**
 * Late game state - close to winning
 */
export const mockLateGameState: GameState = {
  hand: [
    createCard('p-hand-1', '47001', 'ボスの指令', 'trainer', 'supporter'),
    createCard('p-hand-2', '47010', '基本雷エネルギー', 'energy', 'basic'),
  ],
  deck: { size: 12 },
  discard: [
    createCard('p-disc-1', '47012', '基本雷エネルギー', 'energy', 'basic'),
    createCard('p-disc-2', '47013', 'クイックボール', 'trainer', 'item'),
    createCard('p-disc-3', '47014', 'ピカチュウ', 'pokemon', 'basic'),
    createCard('p-disc-4', '47015', '博士の研究', 'trainer', 'supporter'),
    createCard('p-disc-5', '47016', 'ポケモンいれかえ', 'trainer', 'item'),
  ],
  prizes: { remaining: 1 },
  active: createPokemon(
    createCard('p-active', '47110', 'ライチュウ', 'pokemon', 'stage1'),
    90,
    120,
    {
      damage: 30,
      attachedEnergy: [
        createCard('p-e1', '47010', '基本雷エネルギー', 'energy', 'basic'),
        createCard('p-e2', '47010', '基本雷エネルギー', 'energy', 'basic'),
        createCard('p-e3', '47010', '基本雷エネルギー', 'energy', 'basic'),
      ],
      retreatCost: 1,
    }
  ),
  bench: [
    createPokemon(
      createCard('p-bench-1', '47101', 'ピカチュウ', 'pokemon', 'basic'),
      40,
      60,
      {
        damage: 20,
        retreatCost: 1,
      }
    ),
    null,
    null,
    null,
    null,
  ],

  opponent: {
    handSize: 3,
    deckSize: 8,
    discard: [
      createCard('o-disc-1', '47200', 'ネストボール', 'trainer', 'item'),
      createCard('o-disc-2', '47201', 'リザードン', 'pokemon', 'stage2'),
      createCard('o-disc-3', '47202', '基本炎エネルギー', 'energy', 'basic'),
      createCard('o-disc-4', '47203', '基本炎エネルギー', 'energy', 'basic'),
    ],
    prizes: { remaining: 3 },
    active: createPokemon(
      createCard('o-active', '47302', 'リザード', 'pokemon', 'stage1'),
      60,
      90,
      {
        damage: 30,
        attachedEnergy: [
          createCard('o-e1', '47202', '基本炎エネルギー', 'energy', 'basic'),
          createCard('o-e2', '47202', '基本炎エネルギー', 'energy', 'basic'),
        ],
        retreatCost: 2,
      }
    ),
    bench: [
      createPokemon(
        createCard('o-bench-1', '47301', 'ヒトカゲ', 'pokemon', 'basic'),
        50,
        70,
        { retreatCost: 1 }
      ),
      null,
      null,
      null,
      null,
    ],
  },

  stadium: null,
  turnNumber: 15,
  isFirstTurn: false,
  canPlaySupporter: true,
  canAttack: true,
  canRetreat: true,
  energyAttachedThisTurn: false,
};

/**
 * Get a mock game state by name
 */
export function getMockGameState(
  name: 'early' | 'mid' | 'late' = 'mid'
): GameState {
  switch (name) {
    case 'early':
      return mockEarlyGameState;
    case 'mid':
      return mockMidGameState;
    case 'late':
      return mockLateGameState;
    default:
      return mockMidGameState;
  }
}

export default mockMidGameState;
