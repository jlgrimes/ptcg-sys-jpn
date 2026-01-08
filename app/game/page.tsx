'use client';

import { useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { useGameActions } from './hooks/useGameActions';
import { GameBoard } from './components/GameBoard';
import { ActionPanel } from './components/ActionPanel';
import { GameStateLoader, GameStateLoaderInline } from './components/GameStateLoader';

export default function GamePage() {
  const { gameState: loadedState, isLoading, error, loadFromJson, loadMockState, clearState } = useGameState();

  // Use the game actions hook for effect execution
  const {
    gameState,
    setGameState,
    isExecuting,
    pendingChoice,
    actionLog,
    lastMessages,
    dealDamage,
    drawCards,
    applyStatus,
    healPokemon,
    resolveChoice,
    clearLog,
  } = useGameActions(null);

  // Sync loaded state with action state
  useEffect(() => {
    if (loadedState) {
      setGameState(loadedState);
    }
  }, [loadedState, setGameState]);

  const handleClearState = () => {
    clearState();
    setGameState(null);
    clearLog();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">PTCG Game Viewer</h1>
              <p className="text-sm text-gray-500">Visualize and test Pokemon TCG effects</p>
            </div>
            {gameState && (
              <GameStateLoaderInline
                onLoadMock={loadMockState}
                onClear={handleClearState}
                hasState={!!gameState}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <LoadingState />
        ) : gameState ? (
          <div className="flex gap-6">
            {/* Game Board */}
            <div className="flex-1">
              <GameBoard gameState={gameState} />
            </div>

            {/* Action Panel */}
            <div className="w-80 flex-shrink-0">
              <ActionPanel
                isExecuting={isExecuting}
                pendingChoice={pendingChoice}
                lastMessages={lastMessages}
                actionLog={actionLog}
                onDealDamage={dealDamage}
                onDrawCards={drawCards}
                onApplyStatus={applyStatus}
                onHealPokemon={healPokemon}
                onResolveChoice={resolveChoice}
                onClearLog={clearLog}
              />
            </div>
          </div>
        ) : (
          <EmptyState
            onLoad={loadFromJson}
            onLoadMock={loadMockState}
            error={error}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-sm text-gray-400">
        <p>PTCG System - Game State Viewer</p>
      </footer>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500">Loading game state...</span>
      </div>
    </div>
  );
}

/**
 * Empty state with loader
 */
function EmptyState({
  onLoad,
  onLoadMock,
  error,
}: {
  onLoad: (json: string) => void;
  onLoadMock: (name: 'early' | 'mid' | 'late') => void;
  error: string | null;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome Message */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome to the Game Viewer
        </h2>
        <p className="text-gray-500">
          Load a game state to visualize the board. You can paste JSON or use mock data to get started.
        </p>
      </div>

      {/* Loader */}
      <GameStateLoader
        onLoad={onLoad}
        onLoadMock={onLoadMock}
        error={error}
      />

      {/* Features List */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard
          title="View Game State"
          description="Visualize complete game states with active Pokemon, bench, hand, and more."
          icon="👁️"
        />
        <FeatureCard
          title="Card Details"
          description="See card images, damage counters, attached energy, and status conditions."
          icon="🃏"
        />
        <FeatureCard
          title="Both Players"
          description="View both player and opponent fields from the current player's perspective."
          icon="⚔️"
        />
      </div>
    </div>
  );
}

/**
 * Feature card component
 */
function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-medium text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
