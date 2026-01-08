'use client';

import { GameState, CardInstance } from '@/app/lib/notation/training-format';
import { cn } from '@/lib/utils';
import {
  PlayerField,
  playerFieldFromState,
  opponentFieldFromState,
  FieldCallbacks,
  SelectionState,
} from './PlayerField';
import { SimpleCardDisplay } from './CardDisplay';
import { ZoneLabel } from './CardSlot';

/**
 * Callbacks for game board interactions
 */
export interface GameBoardCallbacks {
  player?: FieldCallbacks;
  opponent?: FieldCallbacks;
  onStadiumClick?: () => void;
}

/**
 * Selection state for both players
 */
export interface GameBoardSelection {
  player?: SelectionState;
  opponent?: SelectionState;
}

interface GameBoardProps {
  gameState: GameState;
  callbacks?: GameBoardCallbacks;
  selection?: GameBoardSelection;
  className?: string;
}

/**
 * Full game board displaying both players' fields
 */
export function GameBoard({ gameState, callbacks, selection, className }: GameBoardProps) {
  const playerProps = playerFieldFromState(gameState);
  const opponentProps = opponentFieldFromState(gameState);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl shadow-lg',
        'min-w-[800px] max-w-[1000px] mx-auto',
        className
      )}
    >
      {/* Turn Info Bar */}
      <TurnInfoBar gameState={gameState} />

      {/* Opponent's Field (top) */}
      <PlayerField
        perspective="opponent"
        {...opponentProps}
        callbacks={callbacks?.opponent}
        selection={selection?.opponent}
      />

      {/* Stadium Zone (middle) */}
      <StadiumZone stadium={gameState.stadium} onStadiumClick={callbacks?.onStadiumClick} />

      {/* Player's Field (bottom) */}
      <PlayerField
        perspective="player"
        {...playerProps}
        callbacks={callbacks?.player}
        selection={selection?.player}
      />
    </div>
  );
}

/**
 * Turn information bar
 */
function TurnInfoBar({ gameState }: { gameState: GameState }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/80 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Turn</span>
          <span className="text-lg font-bold text-gray-800">{gameState.turnNumber}</span>
        </div>

        {gameState.isFirstTurn && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
            First Turn
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Action indicators */}
        <ActionIndicator
          label="Supporter"
          available={gameState.canPlaySupporter}
        />
        <ActionIndicator
          label="Energy"
          available={!gameState.energyAttachedThisTurn}
        />
        <ActionIndicator
          label="Attack"
          available={gameState.canAttack}
        />
        <ActionIndicator
          label="Retreat"
          available={gameState.canRetreat}
        />
      </div>
    </div>
  );
}

/**
 * Individual action indicator
 */
function ActionIndicator({
  label,
  available,
}: {
  label: string;
  available: boolean;
}) {
  return (
    <div
      className={cn(
        'text-xs px-2 py-1 rounded',
        available
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-400 line-through'
      )}
    >
      {label}
    </div>
  );
}

/**
 * Stadium zone in the center of the board
 */
function StadiumZone({
  stadium,
  onStadiumClick,
}: {
  stadium: CardInstance | null;
  onStadiumClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex flex-col items-center">
        <ZoneLabel>Stadium</ZoneLabel>
        <div
          className={cn('mt-2', onStadiumClick && 'cursor-pointer hover:scale-105 transition-transform')}
          onClick={onStadiumClick}
          role={onStadiumClick ? 'button' : undefined}
          tabIndex={onStadiumClick ? 0 : undefined}
          onKeyDown={onStadiumClick ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onStadiumClick();
            }
          } : undefined}
        >
          {stadium ? (
            <div className="relative">
              <SimpleCardDisplay card={stadium} size="md" />
              <div className="mt-1 text-center">
                <span className="text-sm font-medium text-gray-700">
                  {stadium.name}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-24 h-33 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Stadium</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact view of the game board for smaller screens
 */
export function GameBoardCompact({ gameState, className }: GameBoardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-2 bg-gradient-to-b from-gray-100 to-gray-200 rounded-xl',
        className
      )}
    >
      {/* Simple header */}
      <div className="flex justify-between text-xs px-2">
        <span>Turn {gameState.turnNumber}</span>
        <span>
          Prizes: {gameState.opponent.prizes.remaining} - {gameState.prizes.remaining}
        </span>
      </div>

      {/* Opponent's active */}
      <div className="flex justify-center">
        {gameState.opponent.active && (
          <div className="relative">
            <SimpleCardDisplay
              card={gameState.opponent.active.card}
              size="sm"
            />
            {gameState.opponent.active.damage > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {gameState.opponent.active.damage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stadium */}
      {gameState.stadium && (
        <div className="flex justify-center">
          <div className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            {gameState.stadium.name}
          </div>
        </div>
      )}

      {/* Player's active */}
      <div className="flex justify-center">
        {gameState.active && (
          <div className="relative">
            <SimpleCardDisplay card={gameState.active.card} size="sm" />
            {gameState.active.damage > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {gameState.active.damage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hand count */}
      <div className="text-center text-xs text-gray-500">
        Hand: {gameState.hand.length} cards
      </div>
    </div>
  );
}
