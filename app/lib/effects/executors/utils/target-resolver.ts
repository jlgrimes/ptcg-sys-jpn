/**
 * Target resolution utilities for the effect execution system
 * Resolves Target objects from effects to actual Pokemon and cards in game state
 */

import {
  GameState,
  CardInstance,
  PokemonState,
} from '../../../notation/training-format';
import { Target, Filter, Location } from '../../types';
import { ResolvedTarget } from '../types';

/**
 * Resolve a Target object to actual Pokemon and cards in the game state
 */
export function resolveTarget(
  state: GameState,
  target: Target
): ResolvedTarget {
  const result: ResolvedTarget = {
    pokemon: [],
    cards: [],
    location: mapLocationType(target.location.type),
    player: target.player === 'both' ? 'self' : target.player,
    benchIndices: [],
  };

  // Handle 'both' player by combining results
  if (target.player === 'both') {
    const selfResult = resolveTargetForPlayer(state, target, 'self');
    const oppResult = resolveTargetForPlayer(state, target, 'opponent');
    return {
      pokemon: [...selfResult.pokemon, ...oppResult.pokemon],
      cards: [...selfResult.cards, ...oppResult.cards],
      location: result.location,
      player: 'self', // Arbitrary, since we're combining both
      benchIndices: [...(selfResult.benchIndices || []), ...(oppResult.benchIndices || [])],
    };
  }

  return resolveTargetForPlayer(state, target, target.player);
}

/**
 * Resolve target for a specific player
 */
function resolveTargetForPlayer(
  state: GameState,
  target: Target,
  player: 'self' | 'opponent'
): ResolvedTarget {
  const result: ResolvedTarget = {
    pokemon: [],
    cards: [],
    location: mapLocationType(target.location.type),
    player,
    benchIndices: [],
  };

  switch (target.location.type) {
    case 'active':
      result.pokemon = resolveActivePokemon(state, player, target.filters);
      break;

    case 'bench':
      const benchResult = resolveBenchPokemon(state, player, target.filters, target.count);
      result.pokemon = benchResult.pokemon;
      result.benchIndices = benchResult.indices;
      break;

    case 'field':
      // Field = active + bench
      const active = resolveActivePokemon(state, player, target.filters);
      const bench = resolveBenchPokemon(state, player, target.filters, undefined);
      result.pokemon = [...active, ...bench.pokemon];
      result.benchIndices = bench.indices;
      break;

    case 'hand':
      result.cards = resolveHandCards(state, player, target);
      break;

    case 'deck':
      result.cards = resolveDeckCards(state, player, target);
      break;

    case 'discard':
      result.cards = resolveDiscardCards(state, player, target);
      break;

    case 'prize':
      result.cards = resolvePrizeCards(state, player, target);
      break;
  }

  // Apply count limit if specified
  if (target.count !== undefined && target.count !== 'all') {
    result.pokemon = result.pokemon.slice(0, target.count);
    result.cards = result.cards.slice(0, target.count);
  }

  return result;
}

/**
 * Map location type string to result location type
 */
function mapLocationType(
  locationType: Location['type']
): ResolvedTarget['location'] {
  switch (locationType) {
    case 'deck':
    case 'hand':
    case 'discard':
    case 'bench':
    case 'active':
    case 'prize':
      return locationType;
    case 'field':
      return 'field';
    default:
      return 'field';
  }
}

/**
 * Resolve active Pokemon
 */
function resolveActivePokemon(
  state: GameState,
  player: 'self' | 'opponent',
  filters?: Filter[]
): PokemonState[] {
  const active = player === 'self' ? state.active : state.opponent.active;
  if (!active) return [];

  if (filters && !matchesPokemonFilters(active, filters)) {
    return [];
  }

  return [active];
}

/**
 * Resolve bench Pokemon
 */
function resolveBenchPokemon(
  state: GameState,
  player: 'self' | 'opponent',
  filters?: Filter[],
  count?: number | 'all'
): { pokemon: PokemonState[]; indices: number[] } {
  const bench = player === 'self' ? state.bench : state.opponent.bench;
  const results: PokemonState[] = [];
  const indices: number[] = [];

  for (let i = 0; i < bench.length; i++) {
    const pokemon = bench[i];
    if (!pokemon) continue;

    if (filters && !matchesPokemonFilters(pokemon, filters)) {
      continue;
    }

    results.push(pokemon);
    indices.push(i);

    if (count !== 'all' && count !== undefined && results.length >= count) {
      break;
    }
  }

  return { pokemon: results, indices };
}

/**
 * Resolve cards from hand
 */
function resolveHandCards(
  state: GameState,
  player: 'self' | 'opponent',
  target: Target
): CardInstance[] {
  // Can only see our own hand
  if (player === 'opponent') {
    return [];
  }

  let cards = state.hand;

  if (target.filters) {
    cards = cards.filter(card => matchesCardFilters(card, target.filters!));
  }

  return cards;
}

/**
 * Resolve cards from deck (only known cards)
 */
function resolveDeckCards(
  state: GameState,
  player: 'self' | 'opponent',
  target: Target
): CardInstance[] {
  // Can only access our own deck
  if (player === 'opponent') {
    return [];
  }

  let cards = state.deck.knownCards || [];

  if (target.filters) {
    cards = cards.filter(card => matchesCardFilters(card, target.filters!));
  }

  return cards;
}

/**
 * Resolve cards from discard pile
 */
function resolveDiscardCards(
  state: GameState,
  player: 'self' | 'opponent',
  target: Target
): CardInstance[] {
  const discard = player === 'self' ? state.discard : state.opponent.discard;
  let cards = discard;

  if (target.filters) {
    cards = cards.filter(card => matchesCardFilters(card, target.filters!));
  }

  return cards;
}

/**
 * Resolve prize cards (only known)
 */
function resolvePrizeCards(
  state: GameState,
  player: 'self' | 'opponent',
  target: Target
): CardInstance[] {
  // Can only access our own prizes
  if (player === 'opponent') {
    return [];
  }

  let cards = state.prizes.knownCards || [];

  if (target.filters) {
    cards = cards.filter(card => matchesCardFilters(card, target.filters!));
  }

  return cards;
}

/**
 * Check if a Pokemon matches all filters
 */
function matchesPokemonFilters(
  pokemon: PokemonState,
  filters: Filter[]
): boolean {
  return filters.every(filter => matchesPokemonFilter(pokemon, filter));
}

/**
 * Check if a Pokemon matches a single filter
 */
function matchesPokemonFilter(
  pokemon: PokemonState,
  filter: Filter
): boolean {
  switch (filter.type) {
    case 'card-type':
      return pokemon.card.type === filter.value;

    case 'evolution-stage':
      return pokemon.card.subtype === filter.value;

    case 'hp':
      return compareValues(pokemon.hp, filter.value as number, filter.comparison);

    case 'status':
      if (filter.value === 'none') {
        return pokemon.status === null;
      }
      return pokemon.status?.type === filter.value;

    case 'energy-type':
      // Check if Pokemon has a specific energy type attached
      return pokemon.attachedEnergy.some(e =>
        e.subtype === filter.value || e.name.toLowerCase().includes(filter.value as string)
      );

    default:
      return true;
  }
}

/**
 * Check if a card matches all filters
 */
function matchesCardFilters(
  card: CardInstance,
  filters: Filter[]
): boolean {
  return filters.every(filter => matchesCardFilter(card, filter));
}

/**
 * Check if a card matches a single filter
 */
function matchesCardFilter(
  card: CardInstance,
  filter: Filter
): boolean {
  switch (filter.type) {
    case 'card-type':
      // Check both type and subtype
      return card.type === filter.value || card.subtype === filter.value;

    case 'evolution-stage':
      return card.subtype === filter.value;

    case 'energy-type':
      if (card.type !== 'energy') return false;
      // Basic vs special energy
      if (filter.subtype) {
        return card.subtype === filter.subtype;
      }
      // Specific energy type
      return card.name.toLowerCase().includes((filter.value as string).toLowerCase());

    default:
      return true;
  }
}

/**
 * Compare two values with a comparison operator
 */
function compareValues(
  actual: number,
  expected: number,
  comparison?: Filter['comparison']
): boolean {
  switch (comparison) {
    case 'less-than-or-equal':
      return actual <= expected;
    case 'equal':
      return actual === expected;
    case 'not-equal':
      return actual !== expected;
    default:
      return actual === expected;
  }
}

/**
 * Get all Pokemon in play for a player (active + bench)
 */
export function getAllPokemonInPlay(
  state: GameState,
  player: 'self' | 'opponent'
): PokemonState[] {
  const active = player === 'self' ? state.active : state.opponent.active;
  const bench = player === 'self' ? state.bench : state.opponent.bench;

  const result: PokemonState[] = [];
  if (active) result.push(active);
  result.push(...bench.filter((p): p is PokemonState => p !== null));

  return result;
}

/**
 * Find a Pokemon by card ID
 */
export function findPokemonByCardId(
  state: GameState,
  player: 'self' | 'opponent',
  cardId: string
): { pokemon: PokemonState; location: 'active' | 'bench'; benchIndex?: number } | null {
  const active = player === 'self' ? state.active : state.opponent.active;
  if (active?.card.id === cardId) {
    return { pokemon: active, location: 'active' };
  }

  const bench = player === 'self' ? state.bench : state.opponent.bench;
  for (let i = 0; i < bench.length; i++) {
    if (bench[i]?.card.id === cardId) {
      return { pokemon: bench[i]!, location: 'bench', benchIndex: i };
    }
  }

  return null;
}

/**
 * Count Pokemon on a player's bench
 */
export function countBenchPokemon(
  state: GameState,
  player: 'self' | 'opponent'
): number {
  const bench = player === 'self' ? state.bench : state.opponent.bench;
  return bench.filter(p => p !== null).length;
}

/**
 * Get the opposite player
 */
export function oppositePlayer(player: 'self' | 'opponent'): 'self' | 'opponent' {
  return player === 'self' ? 'opponent' : 'self';
}
