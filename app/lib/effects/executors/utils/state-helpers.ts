/**
 * Immutable state update helpers for the effect execution system
 */

import {
  GameState,
  CardInstance,
  PokemonState,
  StatusCondition,
} from '../../../notation/training-format';

/**
 * Update the active Pokemon for a player
 */
export function updateActive(
  state: GameState,
  player: 'self' | 'opponent',
  updater: (pokemon: PokemonState | null) => PokemonState | null
): GameState {
  if (player === 'self') {
    return {
      ...state,
      active: updater(state.active),
    };
  } else {
    return {
      ...state,
      opponent: {
        ...state.opponent,
        active: updater(state.opponent.active),
      },
    };
  }
}

/**
 * Update a bench Pokemon at a specific index
 */
export function updateBench(
  state: GameState,
  player: 'self' | 'opponent',
  index: number,
  updater: (pokemon: PokemonState | null) => PokemonState | null
): GameState {
  if (player === 'self') {
    const newBench = [...state.bench];
    newBench[index] = updater(state.bench[index]);
    return {
      ...state,
      bench: newBench,
    };
  } else {
    const newBench = [...state.opponent.bench];
    newBench[index] = updater(state.opponent.bench[index]);
    return {
      ...state,
      opponent: {
        ...state.opponent,
        bench: newBench,
      },
    };
  }
}

/**
 * Update a Pokemon's damage
 */
export function updatePokemonDamage(
  pokemon: PokemonState,
  newDamage: number
): PokemonState {
  return {
    ...pokemon,
    damage: Math.max(0, newDamage),
    hp: Math.max(0, pokemon.maxHp - newDamage),
  };
}

/**
 * Update a Pokemon's status condition
 */
export function updatePokemonStatus(
  pokemon: PokemonState,
  status: StatusCondition | null
): PokemonState {
  return {
    ...pokemon,
    status,
  };
}

/**
 * Add cards to a player's hand
 */
export function addToHand(
  state: GameState,
  cards: CardInstance[]
): GameState {
  return {
    ...state,
    hand: [...state.hand, ...cards],
  };
}

/**
 * Remove cards from a player's hand by ID
 */
export function removeFromHand(
  state: GameState,
  cardIds: string[]
): GameState {
  const idSet = new Set(cardIds);
  return {
    ...state,
    hand: state.hand.filter(c => !idSet.has(c.id)),
  };
}

/**
 * Add cards to discard pile
 */
export function addToDiscard(
  state: GameState,
  player: 'self' | 'opponent',
  cards: CardInstance[]
): GameState {
  if (player === 'self') {
    return {
      ...state,
      discard: [...state.discard, ...cards],
    };
  } else {
    return {
      ...state,
      opponent: {
        ...state.opponent,
        discard: [...state.opponent.discard, ...cards],
      },
    };
  }
}

/**
 * Draw cards from deck to hand
 * Returns [newState, drawnCards]
 */
export function drawCards(
  state: GameState,
  count: number
): [GameState, CardInstance[]] {
  const knownCards = state.deck.knownCards || [];
  const toDraw = Math.min(count, state.deck.size);

  // If we have known cards, use those
  const drawnCards = knownCards.slice(0, toDraw);
  const remainingKnown = knownCards.slice(toDraw);

  // For unknown cards, we need to generate placeholder instances
  const unknownCount = toDraw - drawnCards.length;
  const placeholderCards: CardInstance[] = [];
  for (let i = 0; i < unknownCount; i++) {
    placeholderCards.push({
      id: `drawn_${Date.now()}_${i}`,
      cardId: 'unknown',
      name: 'Unknown Card',
      type: 'trainer', // Placeholder
    });
  }

  const allDrawn = [...drawnCards, ...placeholderCards];

  const newState: GameState = {
    ...state,
    hand: [...state.hand, ...allDrawn],
    deck: {
      size: state.deck.size - toDraw,
      knownCards: remainingKnown.length > 0 ? remainingKnown : undefined,
    },
  };

  return [newState, allDrawn];
}

/**
 * Shuffle deck (resets known cards)
 */
export function shuffleDeck(state: GameState): GameState {
  return {
    ...state,
    deck: {
      size: state.deck.size,
      knownCards: undefined, // Shuffling removes knowledge of card order
    },
  };
}

/**
 * Move active Pokemon to bench and promote bench Pokemon to active
 */
export function switchPokemon(
  state: GameState,
  player: 'self' | 'opponent',
  benchIndex: number
): GameState {
  if (player === 'self') {
    const currentActive = state.active;
    const newActive = state.bench[benchIndex];

    if (!newActive) return state;

    const newBench = [...state.bench];
    newBench[benchIndex] = currentActive;

    return {
      ...state,
      active: newActive,
      bench: newBench,
    };
  } else {
    const currentActive = state.opponent.active;
    const newActive = state.opponent.bench[benchIndex];

    if (!newActive) return state;

    const newBench = [...state.opponent.bench];
    newBench[benchIndex] = currentActive;

    return {
      ...state,
      opponent: {
        ...state.opponent,
        active: newActive,
        bench: newBench,
      },
    };
  }
}

/**
 * Move a Pokemon to the discard pile (knockout)
 * Returns the cards that were discarded (Pokemon + attached cards)
 */
export function knockoutPokemon(
  state: GameState,
  player: 'self' | 'opponent',
  location: 'active' | 'bench',
  benchIndex?: number
): [GameState, CardInstance[]] {
  const pokemon = location === 'active'
    ? (player === 'self' ? state.active : state.opponent.active)
    : (player === 'self' ? state.bench[benchIndex!] : state.opponent.bench[benchIndex!]);

  if (!pokemon) return [state, []];

  // Collect all cards to discard
  const discardedCards: CardInstance[] = [
    pokemon.card,
    ...pokemon.attachedEnergy,
    ...pokemon.attachedTools,
  ];

  let newState = state;

  // Remove the Pokemon
  if (location === 'active') {
    newState = updateActive(newState, player, () => null);
  } else {
    newState = updateBench(newState, player, benchIndex!, () => null);
  }

  // Add to discard
  newState = addToDiscard(newState, player, discardedCards);

  return [newState, discardedCards];
}

/**
 * Take prize cards
 */
export function takePrize(
  state: GameState,
  player: 'self' | 'opponent',
  count: number
): GameState {
  if (player === 'self') {
    const knownPrizes = state.prizes.knownCards || [];
    const takenCards = knownPrizes.slice(0, Math.min(count, state.prizes.remaining));
    const remainingKnown = knownPrizes.slice(count);

    return {
      ...state,
      hand: [...state.hand, ...takenCards],
      prizes: {
        remaining: Math.max(0, state.prizes.remaining - count),
        knownCards: remainingKnown.length > 0 ? remainingKnown : undefined,
      },
    };
  } else {
    return {
      ...state,
      opponent: {
        ...state.opponent,
        prizes: {
          remaining: Math.max(0, state.opponent.prizes.remaining - count),
        },
      },
    };
  }
}

/**
 * Add energy to a Pokemon
 */
export function attachEnergy(
  state: GameState,
  player: 'self' | 'opponent',
  location: 'active' | 'bench',
  energy: CardInstance,
  benchIndex?: number
): GameState {
  const updater = (pokemon: PokemonState | null): PokemonState | null => {
    if (!pokemon) return null;
    return {
      ...pokemon,
      attachedEnergy: [...pokemon.attachedEnergy, energy],
    };
  };

  if (location === 'active') {
    return updateActive(state, player, updater);
  } else {
    return updateBench(state, player, benchIndex!, updater);
  }
}

/**
 * Remove energy from a Pokemon
 */
export function removeEnergy(
  state: GameState,
  player: 'self' | 'opponent',
  location: 'active' | 'bench',
  energyId: string,
  benchIndex?: number
): [GameState, CardInstance | null] {
  let removedEnergy: CardInstance | null = null;

  const updater = (pokemon: PokemonState | null): PokemonState | null => {
    if (!pokemon) return null;
    const index = pokemon.attachedEnergy.findIndex(e => e.id === energyId);
    if (index === -1) return pokemon;

    removedEnergy = pokemon.attachedEnergy[index];
    return {
      ...pokemon,
      attachedEnergy: [
        ...pokemon.attachedEnergy.slice(0, index),
        ...pokemon.attachedEnergy.slice(index + 1),
      ],
    };
  };

  let newState: GameState;
  if (location === 'active') {
    newState = updateActive(state, player, updater);
  } else {
    newState = updateBench(state, player, benchIndex!, updater);
  }

  return [newState, removedEnergy];
}

/**
 * Find a bench slot that's empty
 */
export function findEmptyBenchSlot(
  state: GameState,
  player: 'self' | 'opponent'
): number | null {
  const bench = player === 'self' ? state.bench : state.opponent.bench;
  const index = bench.findIndex(slot => slot === null);
  return index === -1 ? null : index;
}

/**
 * Add a Pokemon to the bench
 */
export function addToBench(
  state: GameState,
  player: 'self' | 'opponent',
  pokemon: PokemonState
): GameState | null {
  const slotIndex = findEmptyBenchSlot(state, player);
  if (slotIndex === null) return null;

  return updateBench(state, player, slotIndex, () => pokemon);
}

/**
 * Create a fresh PokemonState from a card
 */
export function createPokemonState(
  card: CardInstance,
  maxHp: number
): PokemonState {
  return {
    card,
    hp: maxHp,
    maxHp,
    damage: 0,
    status: null,
    attachedEnergy: [],
    attachedTools: [],
    abilities: [],
    canRetreat: true,
    retreatCost: 0,
  };
}
