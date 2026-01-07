'use client';

import { useState, useCallback } from 'react';
import { GameState } from '@/app/lib/notation/training-format';
import { getMockGameState } from '../lib/mock-game-state';

interface UseGameStateReturn {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  loadFromJson: (json: string) => void;
  loadMockState: (name?: 'early' | 'mid' | 'late') => void;
  clearState: () => void;
}

/**
 * Hook for managing game state
 */
export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromJson = useCallback((json: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const parsed = JSON.parse(json);

      // Basic validation
      if (!parsed.hand || !parsed.deck || !parsed.opponent) {
        throw new Error('Invalid GameState: missing required fields (hand, deck, opponent)');
      }

      if (!Array.isArray(parsed.hand)) {
        throw new Error('Invalid GameState: hand must be an array');
      }

      if (!Array.isArray(parsed.bench) || parsed.bench.length !== 5) {
        throw new Error('Invalid GameState: bench must be an array of 5 slots');
      }

      setGameState(parsed as GameState);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse JSON';
      setError(message);
      setGameState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMockState = useCallback((name: 'early' | 'mid' | 'late' = 'mid') => {
    setIsLoading(true);
    setError(null);

    try {
      const state = getMockGameState(name);
      setGameState(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load mock state';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearState = useCallback(() => {
    setGameState(null);
    setError(null);
  }, []);

  return {
    gameState,
    isLoading,
    error,
    loadFromJson,
    loadMockState,
    clearState,
  };
}
