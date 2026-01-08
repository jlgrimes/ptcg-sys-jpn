'use client';

import { useState, useCallback, useMemo } from 'react';
import { GameState, PokemonState, CardInstance } from '@/app/lib/notation/training-format';
import { Effect, EffectType } from '@/app/lib/effects/types';
import {
  executeEffect,
  executeEffects,
  ExecutionContext,
  ExecutionMessage,
  SimpleSeededRNG,
  ChoiceCallback,
  ChoiceRequest,
} from '@/app/lib/effects/executors';

/**
 * Types of game actions a player can take
 */
export type GameActionType =
  | 'attack'
  | 'ability'
  | 'retreat'
  | 'play-pokemon'
  | 'play-trainer'
  | 'attach-energy'
  | 'end-turn';

/**
 * Represents an action the player wants to take
 */
export interface GameAction {
  type: GameActionType;
  sourceId?: string;      // Card ID initiating the action
  targetId?: string;      // Target card/Pokemon ID
  moveName?: string;      // For attacks
  abilityName?: string;   // For abilities
  effects?: Effect[];     // Effects to execute
}

/**
 * Pending choice that needs player input
 */
export interface PendingChoice {
  request: ChoiceRequest;
  resolve: (indices: number[]) => void;
}

/**
 * Action log entry
 */
export interface ActionLogEntry {
  turn: number;
  action: GameAction;
  messages: ExecutionMessage[];
  timestamp: Date;
}

/**
 * Return type for the useGameActions hook
 */
export interface UseGameActionsReturn {
  // State
  gameState: GameState | null;
  isExecuting: boolean;
  pendingChoice: PendingChoice | null;
  actionLog: ActionLogEntry[];
  lastMessages: ExecutionMessage[];

  // State management
  setGameState: (state: GameState | null) => void;

  // Action execution
  executeAction: (action: GameAction) => Promise<void>;
  executeEffectsOnState: (effects: Effect[]) => Promise<void>;

  // Choice resolution
  resolveChoice: (selectedIndices: number[]) => void;

  // Demo actions (for testing)
  dealDamage: (amount: number, target: 'self' | 'opponent') => Promise<void>;
  drawCards: (count: number) => Promise<void>;
  applyStatus: (status: 'paralyzed' | 'asleep' | 'confused' | 'burned' | 'poisoned') => Promise<void>;
  healPokemon: (amount: number) => Promise<void>;

  // Utility
  clearLog: () => void;
}

/**
 * Hook for managing game actions and effect execution
 */
export function useGameActions(initialState: GameState | null = null): UseGameActionsReturn {
  const [gameState, setGameState] = useState<GameState | null>(initialState);
  const [isExecuting, setIsExecuting] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [lastMessages, setLastMessages] = useState<ExecutionMessage[]>([]);

  // Create execution context with choice callbacks
  const createContext = useCallback((): ExecutionContext => {
    const rng = new SimpleSeededRNG(Date.now());

    const createChoiceCallback = (player: 'self' | 'opponent'): ChoiceCallback => {
      return (request: ChoiceRequest): Promise<number[]> => {
        return new Promise((resolve) => {
          setPendingChoice({ request: { ...request, player }, resolve });
        });
      };
    };

    return {
      rng,
      chooseForSelf: createChoiceCallback('self'),
      chooseForOpponent: createChoiceCallback('opponent'),
    };
  }, []);

  // Resolve a pending choice
  const resolveChoice = useCallback((selectedIndices: number[]) => {
    if (pendingChoice) {
      pendingChoice.resolve(selectedIndices);
      setPendingChoice(null);
    }
  }, [pendingChoice]);

  // Execute effects on the current game state
  const executeEffectsOnState = useCallback(async (effects: Effect[]) => {
    if (!gameState) return;

    setIsExecuting(true);
    try {
      const context = createContext();
      const result = await executeEffects(gameState, effects, context);

      setGameState(result.state);
      setLastMessages(result.messages);

      // Log the action
      setActionLog(prev => [...prev, {
        turn: gameState.turnNumber,
        action: { type: 'attack', effects },
        messages: result.messages,
        timestamp: new Date(),
      }]);
    } finally {
      setIsExecuting(false);
    }
  }, [gameState, createContext]);

  // Execute a game action
  const executeAction = useCallback(async (action: GameAction) => {
    if (!gameState) return;

    setIsExecuting(true);
    try {
      let effects: Effect[] = action.effects || [];

      // Build effects based on action type if not provided
      if (effects.length === 0) {
        switch (action.type) {
          case 'attack':
            // In a real implementation, we'd look up the move's effects from card data
            // For now, this is a placeholder
            break;

          case 'retreat':
            effects = [{
              type: EffectType.Switch,
              target: 'self',
            }];
            break;

          case 'end-turn':
            // Process end-of-turn effects (burn damage, poison damage, etc.)
            if (gameState.active?.status) {
              const status = gameState.active.status.type;
              if (status === 'burned' || status === 'poisoned') {
                effects.push({
                  type: EffectType.Counter,
                  value: status === 'burned' ? 2 : 1, // Burn = 20, Poison = 10
                  action: 'place',
                  targets: [{
                    type: 'pokemon',
                    player: 'self',
                    location: { type: 'active' },
                  }],
                });
              }
            }
            break;
        }
      }

      if (effects.length > 0) {
        const context = createContext();
        const result = await executeEffects(gameState, effects, context);

        setGameState(result.state);
        setLastMessages(result.messages);

        setActionLog(prev => [...prev, {
          turn: gameState.turnNumber,
          action,
          messages: result.messages,
          timestamp: new Date(),
        }]);
      }
    } finally {
      setIsExecuting(false);
    }
  }, [gameState, createContext]);

  // Demo action: Deal damage
  const dealDamage = useCallback(async (amount: number, target: 'self' | 'opponent') => {
    const effects: Effect[] = [{
      type: EffectType.Damage,
      value: amount,
      targets: [{
        type: 'pokemon',
        player: target,
        location: { type: 'active' },
      }],
    }];
    await executeEffectsOnState(effects);
  }, [executeEffectsOnState]);

  // Demo action: Draw cards
  const drawCards = useCallback(async (count: number) => {
    const effects: Effect[] = [{
      type: EffectType.Draw,
      value: count,
    }];
    await executeEffectsOnState(effects);
  }, [executeEffectsOnState]);

  // Demo action: Apply status
  const applyStatus = useCallback(async (
    status: 'paralyzed' | 'asleep' | 'confused' | 'burned' | 'poisoned'
  ) => {
    const effects: Effect[] = [{
      type: EffectType.Status,
      status,
      targets: [{
        type: 'pokemon',
        player: 'opponent',
        location: { type: 'active' },
      }],
    }];
    await executeEffectsOnState(effects);
  }, [executeEffectsOnState]);

  // Demo action: Heal
  const healPokemon = useCallback(async (amount: number) => {
    const effects: Effect[] = [{
      type: EffectType.Heal,
      value: amount,
      unit: 'hp',
      targets: [{
        type: 'pokemon',
        player: 'self',
        location: { type: 'active' },
      }],
    }];
    await executeEffectsOnState(effects);
  }, [executeEffectsOnState]);

  // Clear action log
  const clearLog = useCallback(() => {
    setActionLog([]);
    setLastMessages([]);
  }, []);

  return {
    gameState,
    isExecuting,
    pendingChoice,
    actionLog,
    lastMessages,
    setGameState,
    executeAction,
    executeEffectsOnState,
    resolveChoice,
    dealDamage,
    drawCards,
    applyStatus,
    healPokemon,
    clearLog,
  };
}
