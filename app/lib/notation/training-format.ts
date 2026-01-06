/**
 * Training Data Format for ML/AI
 *
 * Explicit state/action pairs for reinforcement learning and supervised training.
 * Each decision point captures the full observable game state and the action taken.
 */

/**
 * A single training sample - one decision point
 */
export interface TrainingSample {
  // Unique identifier for this decision point
  id: string;

  // Game metadata
  gameId: string;
  turnNumber: number;
  player: 1 | 2;

  // The action that was taken
  action: TrainingAction;

  // All legal actions at this decision point
  legalActions: TrainingAction[];

  // Full observable state
  state: GameState;

  // Outcome (for reward signal)
  outcome?: {
    winner: 1 | 2 | 'draw';
    turnsRemaining: number; // How many turns until game ended
  };
}

/**
 * Complete observable game state at a decision point
 */
export interface GameState {
  // Current player's perspective
  hand: CardInstance[];
  deck: DeckState;
  discard: CardInstance[];
  prizes: PrizeState;
  active: PokemonState | null;
  bench: (PokemonState | null)[]; // Fixed 5 slots

  // Opponent's observable state
  opponent: {
    handSize: number;
    deckSize: number;
    discard: CardInstance[]; // Discard is public
    prizes: PrizeState;
    active: PokemonState | null;
    bench: (PokemonState | null)[];
  };

  // Shared state
  stadium: CardInstance | null;
  turnNumber: number;
  isFirstTurn: boolean;
  canPlaySupporter: boolean;
  canAttack: boolean;
  canRetreat: boolean;
  energyAttachedThisTurn: boolean;
}

/**
 * Card instance with unique ID for tracking
 */
export interface CardInstance {
  id: string; // Unique instance ID (e.g., "card_42")
  cardId: string; // Card template ID (e.g., "sv1-025" for Pikachu)
  name: string;
  type: 'pokemon' | 'trainer' | 'energy';
  subtype?: string; // 'basic', 'stage1', 'item', 'supporter', etc.
}

/**
 * Pokemon on the field with full state
 */
export interface PokemonState {
  card: CardInstance;
  hp: number;
  maxHp: number;
  damage: number;
  status: StatusCondition | null;
  attachedEnergy: CardInstance[];
  attachedTools: CardInstance[];
  abilities: AbilityState[];
  canRetreat: boolean;
  retreatCost: number;
}

export interface StatusCondition {
  type: 'paralyzed' | 'asleep' | 'confused' | 'burned' | 'poisoned';
  turnsRemaining?: number;
}

export interface AbilityState {
  name: string;
  used: boolean; // For once-per-turn abilities
}

export interface DeckState {
  size: number;
  // For training, we might include known cards (from searches)
  knownCards?: CardInstance[];
}

export interface PrizeState {
  remaining: number;
  // Cards we've seen (from prize checks)
  knownCards?: CardInstance[];
}

/**
 * Action representation for training
 */
export interface TrainingAction {
  type: ActionType;
  cardId?: string; // Which card is being played/attached/etc.
  targetId?: string; // Target Pokemon/card
  moveName?: string; // For attacks
  abilityName?: string; // For abilities

  // Serialized form for easy comparison
  notation: string;
}

export type ActionType =
  | 'play_pokemon'
  | 'play_trainer'
  | 'attach_energy'
  | 'evolve'
  | 'retreat'
  | 'attack'
  | 'ability'
  | 'pass';

/**
 * Full training dataset from a game
 */
export interface TrainingGame {
  gameId: string;
  metadata: TrainingGameMetadata;
  samples: TrainingSample[];
}

export interface TrainingGameMetadata {
  seed: number;
  player1Deck: DeckList;
  player2Deck: DeckList;
  winner: 1 | 2 | 'draw';
  totalTurns: number;
  format: string;
  timestamp: string;
}

export interface DeckList {
  cards: DeckCard[];
}

export interface DeckCard {
  cardId: string;
  name: string;
  count: number;
}

/**
 * Convert a game state to a feature vector for ML
 * This is a simplified numeric representation
 */
export function stateToFeatures(state: GameState): number[] {
  const features: number[] = [];

  // Hand features
  features.push(state.hand.length); // Hand size
  features.push(state.hand.filter(c => c.type === 'pokemon').length);
  features.push(state.hand.filter(c => c.type === 'trainer').length);
  features.push(state.hand.filter(c => c.type === 'energy').length);

  // Deck/discard
  features.push(state.deck.size);
  features.push(state.discard.length);
  features.push(state.prizes.remaining);

  // Active Pokemon
  if (state.active) {
    features.push(1); // Has active
    features.push(state.active.hp / state.active.maxHp); // HP ratio
    features.push(state.active.attachedEnergy.length);
    features.push(state.active.status ? 1 : 0);
  } else {
    features.push(0, 0, 0, 0);
  }

  // Bench
  const benchCount = state.bench.filter(p => p !== null).length;
  features.push(benchCount);

  // Opponent state
  features.push(state.opponent.handSize);
  features.push(state.opponent.deckSize);
  features.push(state.opponent.prizes.remaining);

  if (state.opponent.active) {
    features.push(1);
    features.push(state.opponent.active.hp / state.opponent.active.maxHp);
    features.push(state.opponent.active.attachedEnergy.length);
  } else {
    features.push(0, 0, 0);
  }

  const oppBenchCount = state.opponent.bench.filter(p => p !== null).length;
  features.push(oppBenchCount);

  // Turn info
  features.push(state.turnNumber);
  features.push(state.isFirstTurn ? 1 : 0);
  features.push(state.canAttack ? 1 : 0);
  features.push(state.canPlaySupporter ? 1 : 0);

  return features;
}

/**
 * Create a unique action key for deduplication/lookup
 */
export function actionToKey(action: TrainingAction): string {
  return action.notation;
}

/**
 * Generate all legal actions from a game state
 * (Stub - would need full game rules implementation)
 */
export function getLegalActions(state: GameState): TrainingAction[] {
  const actions: TrainingAction[] = [];

  // Always can pass
  actions.push({
    type: 'pass',
    notation: 'Pass',
  });

  // Play Pokemon from hand
  for (const card of state.hand) {
    if (card.type === 'pokemon' && card.subtype === 'basic') {
      // Can play to bench if space
      const benchSpace = state.bench.filter(p => p === null).length;
      if (benchSpace > 0) {
        actions.push({
          type: 'play_pokemon',
          cardId: card.id,
          notation: `PlayPokemon(${card.id}:${card.name})`,
        });
      }
    }
  }

  // Attach energy (one per turn)
  if (!state.energyAttachedThisTurn) {
    for (const card of state.hand) {
      if (card.type === 'energy') {
        // Can attach to active
        if (state.active) {
          actions.push({
            type: 'attach_energy',
            cardId: card.id,
            targetId: state.active.card.id,
            notation: `Attach(${card.id}:${card.name}->${state.active.card.name})`,
          });
        }
        // Can attach to bench
        for (const benchPoke of state.bench) {
          if (benchPoke) {
            actions.push({
              type: 'attach_energy',
              cardId: card.id,
              targetId: benchPoke.card.id,
              notation: `Attach(${card.id}:${card.name}->${benchPoke.card.name})`,
            });
          }
        }
      }
    }
  }

  // Play trainers
  for (const card of state.hand) {
    if (card.type === 'trainer') {
      if (card.subtype === 'supporter' && !state.canPlaySupporter) {
        continue; // Already played supporter
      }
      actions.push({
        type: 'play_trainer',
        cardId: card.id,
        notation: `Play(${card.id}:${card.name})`,
      });
    }
  }

  // Attack (simplified - would need move data)
  if (state.canAttack && state.active) {
    actions.push({
      type: 'attack',
      moveName: 'Attack', // Would need actual move names
      notation: `Attack(${state.active.card.name})`,
    });
  }

  // Retreat
  if (state.canRetreat && state.active && state.bench.some(p => p !== null)) {
    for (const benchPoke of state.bench) {
      if (benchPoke) {
        actions.push({
          type: 'retreat',
          targetId: benchPoke.card.id,
          notation: `Retreat(${state.active.card.name}<->${benchPoke.card.name})`,
        });
      }
    }
  }

  return actions;
}
