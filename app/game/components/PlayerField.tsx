'use client';

import { CardInstance, PokemonState, GameState } from '@/app/lib/notation/training-format';
import { cn } from '@/lib/utils';
import { CardDisplay, SimpleCardDisplay } from './CardDisplay';
import { CardSlot, ZoneLabel } from './CardSlot';

/**
 * Callbacks for interacting with field elements
 */
export interface FieldCallbacks {
  onActiveClick?: () => void;
  onBenchClick?: (index: number) => void;
  onHandCardClick?: (cardId: string) => void;
  onDeckClick?: () => void;
  onDiscardClick?: () => void;
}

/**
 * Selection state for highlighting selectable options
 */
export interface SelectionState {
  selectableActive?: boolean;
  selectableBench?: boolean[];
  selectableHand?: string[];
  selectedActive?: boolean;
  selectedBench?: number[];
  selectedHand?: string[];
}

interface PlayerFieldProps {
  // Player's own view or opponent's observable state
  perspective: 'player' | 'opponent';
  // The state to display
  active: PokemonState | null;
  bench: (PokemonState | null)[];
  // For player: full hand. For opponent: just the count
  hand?: CardInstance[];
  handSize?: number;
  // Deck info
  deckSize: number;
  // Discard pile
  discard: CardInstance[];
  // Prize cards
  prizesRemaining: number;
  // Optional: flipped layout for opponent
  flipped?: boolean;
  className?: string;
  // Interaction callbacks
  callbacks?: FieldCallbacks;
  // Selection state for choices
  selection?: SelectionState;
}

/**
 * Displays a single player's field with all zones
 */
export function PlayerField({
  perspective,
  active,
  bench,
  hand,
  handSize,
  deckSize,
  discard,
  prizesRemaining,
  flipped = false,
  className,
  callbacks,
  selection,
}: PlayerFieldProps) {
  const isOpponent = perspective === 'opponent';
  const displayHandSize = hand?.length ?? handSize ?? 0;

  return (
    <div
      className={cn(
        'w-full p-4 rounded-xl',
        isOpponent ? 'bg-red-50/50' : 'bg-blue-50/50',
        flipped && 'rotate-180',
        className
      )}
    >
      {/* Player Label */}
      <div className={cn('mb-3 flex items-center gap-2', flipped && 'rotate-180')}>
        <ZoneLabel variant={isOpponent ? 'opponent' : 'active'}>
          {isOpponent ? 'Opponent' : 'Player'}
        </ZoneLabel>
        <span className="text-sm text-gray-500">
          Prizes: {prizesRemaining}
        </span>
      </div>

      {/* Main Field Layout */}
      <div className={cn('flex gap-4', flipped && 'rotate-180')}>
        {/* Left Side: Prizes */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 text-center mb-1">Prizes</span>
          <div className="grid grid-cols-2 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-8 h-11 rounded border',
                  i < prizesRemaining
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800 border-blue-900'
                    : 'bg-gray-200 border-gray-300 border-dashed'
                )}
              />
            ))}
          </div>
        </div>

        {/* Center: Active + Bench */}
        <div className="flex-1 flex flex-col items-center gap-3">
          {/* Active Pokemon */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">Active</span>
            <CardSlot
              isEmpty={!active}
              size="md"
              onClick={callbacks?.onActiveClick}
              selectable={selection?.selectableActive}
              selected={selection?.selectedActive}
            >
              {active && (
                <CardDisplay
                  card={active.card}
                  pokemonState={active}
                  size="md"
                />
              )}
            </CardSlot>
          </div>

          {/* Bench */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">Bench</span>
            <div className="flex gap-2">
              {bench.map((pokemon, i) => (
                <CardSlot
                  key={i}
                  isEmpty={!pokemon}
                  size="sm"
                  label={`B${i + 1}`}
                  onClick={pokemon && callbacks?.onBenchClick ? () => callbacks.onBenchClick?.(i) : undefined}
                  selectable={selection?.selectableBench?.[i]}
                  selected={selection?.selectedBench?.includes(i)}
                >
                  {pokemon && (
                    <CardDisplay
                      card={pokemon.card}
                      pokemonState={pokemon}
                      size="sm"
                    />
                  )}
                </CardSlot>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Deck + Discard */}
        <div className="flex flex-col gap-3">
          {/* Deck */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">Deck</span>
            <div className="relative">
              <div className="w-16 h-22 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-900 shadow-md" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{deckSize}</span>
              </div>
            </div>
          </div>

          {/* Discard */}
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">Discard</span>
            <div className="relative">
              {discard.length > 0 ? (
                <>
                  <SimpleCardDisplay
                    card={discard[discard.length - 1]}
                    size="sm"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {discard.length}
                  </div>
                </>
              ) : (
                <CardSlot isEmpty size="sm" label="Empty" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hand - Only shown in detail for player, count for opponent */}
      <div className={cn('mt-4', flipped && 'rotate-180')}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">Hand</span>
          <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">
            {displayHandSize} cards
          </span>
        </div>

        {!isOpponent && hand ? (
          // Player's hand - show all cards
          <div className="flex gap-1 flex-wrap">
            {hand.map((card) => {
              const isSelectable = selection?.selectableHand?.includes(card.id);
              const isSelected = selection?.selectedHand?.includes(card.id);
              return (
                <div
                  key={card.id}
                  role={callbacks?.onHandCardClick ? 'button' : undefined}
                  tabIndex={callbacks?.onHandCardClick ? 0 : undefined}
                  onClick={callbacks?.onHandCardClick ? () => callbacks.onHandCardClick?.(card.id) : undefined}
                  onKeyDown={callbacks?.onHandCardClick ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      callbacks?.onHandCardClick?.(card.id);
                    }
                  } : undefined}
                  className={cn(
                    'transition-all rounded-lg',
                    callbacks?.onHandCardClick && 'cursor-pointer hover:scale-105',
                    isSelectable && !isSelected && 'ring-2 ring-green-400/50 ring-offset-1',
                    isSelected && 'ring-2 ring-blue-500 ring-offset-2'
                  )}
                >
                  <SimpleCardDisplay card={card} size="sm" />
                </div>
              );
            })}
          </div>
        ) : (
          // Opponent's hand - show face-down cards
          <div className="flex gap-1">
            {Array.from({ length: Math.min(displayHandSize, 7) }).map((_, i) => (
              <SimpleCardDisplay key={i} card={null} faceDown size="sm" />
            ))}
            {displayHandSize > 7 && (
              <div className="flex items-center text-xs text-gray-500">
                +{displayHandSize - 7}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Create PlayerField props from a GameState for the current player
 */
export function playerFieldFromState(state: GameState): Omit<PlayerFieldProps, 'perspective'> {
  return {
    active: state.active,
    bench: state.bench,
    hand: state.hand,
    deckSize: state.deck.size,
    discard: state.discard,
    prizesRemaining: state.prizes.remaining,
  };
}

/**
 * Create PlayerField props from a GameState for the opponent
 */
export function opponentFieldFromState(state: GameState): Omit<PlayerFieldProps, 'perspective'> {
  return {
    active: state.opponent.active,
    bench: state.opponent.bench,
    handSize: state.opponent.handSize,
    deckSize: state.opponent.deckSize,
    discard: state.opponent.discard,
    prizesRemaining: state.opponent.prizes.remaining,
  };
}
