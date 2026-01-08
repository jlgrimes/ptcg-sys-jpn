/**
 * Effect Executor Registry
 *
 * Main entry point for executing card effects.
 * Uses a registry pattern to map effect types to their executor functions.
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  createTestContext,
} from './types';
import { evaluateConditions } from './utils/condition-evaluator';

// Import all executors
import { damageExecutor, executeDamage } from './damage-executor';
import { healExecutor, executeHeal } from './heal-executor';
import { counterExecutor, executeCounter } from './counter-executor';
import { statusExecutor, executeStatus } from './status-executor';
import { drawExecutor, executeDraw } from './draw-executor';
import { discardExecutor, executeDiscard } from './discard-executor';
import { shuffleExecutor, executeShuffle } from './shuffle-executor';
import { searchExecutor, executeSearch } from './search-executor';
import { switchExecutor, executeSwitch } from './switch-executor';
import { energyExecutor, executeEnergy } from './energy-executor';
import { placeExecutor, executePlace } from './place-executor';
import { preventionExecutor, executePrevention } from './prevention-executor';
import { deckManipulationExecutor, executeDeckManipulation } from './deck-manipulation-executor';
import { retreatModifierExecutor, executeRetreatModifier } from './retreat-modifier-executor';
import { trainerBlockExecutor, executeTrainerBlock } from './trainer-block-executor';
import { prizeExecutor, executePrize } from './prize-executor';
import { revealExecutor, executeReveal } from './reveal-executor';
import { choiceExecutor, executeChoice } from './choice-executor';
import { copyExecutor, executeCopy } from './copy-executor';
import { restrictionExecutor, executeRestriction } from './restriction-executor';

/**
 * Type for executor functions
 */
type ExecutorFunction = (
  state: GameState,
  effect: Effect,
  context: ExecutionContext
) => Promise<ExecutionResult>;

/**
 * Registry mapping effect types to their executor functions
 */
const executorRegistry = new Map<EffectType, ExecutorFunction>([
  [EffectType.Damage, executeDamage],
  [EffectType.Heal, executeHeal],
  [EffectType.Counter, executeCounter],
  [EffectType.Status, executeStatus],
  [EffectType.Draw, executeDraw],
  [EffectType.Discard, executeDiscard],
  [EffectType.Shuffle, executeShuffle],
  [EffectType.Search, executeSearch],
  [EffectType.Switch, executeSwitch],
  [EffectType.Energy, executeEnergy],
  [EffectType.Place, executePlace],
  [EffectType.Prevention, executePrevention],
  [EffectType.DeckManipulation, executeDeckManipulation],
  [EffectType.RetreatModifier, executeRetreatModifier],
  [EffectType.TrainerBlock, executeTrainerBlock],
  [EffectType.Prize, executePrize],
  [EffectType.Reveal, executeReveal],
  [EffectType.Choice, executeChoice],
  [EffectType.Copy, executeCopy],
  [EffectType.Restriction, executeRestriction],
]);

/**
 * Execute a single effect
 *
 * @param state - Current game state
 * @param effect - Effect to execute
 * @param context - Execution context with RNG and choice callbacks
 * @returns New game state and execution messages
 */
export async function executeEffect(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  // Handle conditions first
  if (effect.conditions && effect.conditions.length > 0) {
    const conditionResult = await evaluateConditions(state, effect.conditions, context);

    if (!conditionResult.passed) {
      // Execute failure effects if any
      if (conditionResult.failureEffects && conditionResult.failureEffects.length > 0) {
        const failureResult = await executeEffects(state, conditionResult.failureEffects, context);
        return {
          ...failureResult,
          messages: [...conditionResult.messages, ...failureResult.messages],
        };
      }
      return {
        state,
        messages: [
          ...conditionResult.messages,
          { type: 'info', message: 'Condition not met - effect skipped', data: {} },
        ],
      };
    }

    // If condition passed and has success effects, execute those instead
    if (conditionResult.successEffects && conditionResult.successEffects.length > 0) {
      const successResult = await executeEffects(state, conditionResult.successEffects, context);
      return {
        ...successResult,
        messages: [...conditionResult.messages, ...successResult.messages],
      };
    }
  }

  // Get executor for this effect type
  const executor = executorRegistry.get(effect.type as EffectType);

  if (!executor) {
    return {
      state,
      messages: [{
        type: 'info',
        message: `Unknown effect type: ${effect.type}`,
        data: { effectType: effect.type },
      }],
    };
  }

  // Execute the effect
  const result = await executor(state, effect, context);

  // Handle pending effects (compound effects)
  if (result.pendingEffects && result.pendingEffects.length > 0) {
    const pendingResult = await executeEffects(result.state, result.pendingEffects, context);
    return {
      state: pendingResult.state,
      messages: [...result.messages, ...pendingResult.messages],
    };
  }

  return result;
}

/**
 * Execute multiple effects in sequence
 *
 * @param state - Current game state
 * @param effects - Effects to execute
 * @param context - Execution context
 * @returns New game state and all execution messages
 */
export async function executeEffects(
  state: GameState,
  effects: Effect[],
  context: ExecutionContext
): Promise<ExecutionResult> {
  let currentState = state;
  const allMessages: ExecutionMessage[] = [];

  for (const effect of effects) {
    const result = await executeEffect(currentState, effect, context);
    currentState = result.state;
    allMessages.push(...result.messages);
  }

  return {
    state: currentState,
    messages: allMessages,
  };
}

/**
 * Execute an effect with auto-choices (for testing)
 *
 * @param state - Current game state
 * @param effect - Effect to execute
 * @param seed - Random seed for deterministic execution
 * @returns New game state and execution messages
 */
export async function executeEffectAuto(
  state: GameState,
  effect: Effect,
  seed: number = 12345
): Promise<ExecutionResult> {
  const context = createTestContext(seed);
  return executeEffect(state, effect, context);
}

/**
 * Execute multiple effects with auto-choices (for testing)
 */
export async function executeEffectsAuto(
  state: GameState,
  effects: Effect[],
  seed: number = 12345
): Promise<ExecutionResult> {
  const context = createTestContext(seed);
  return executeEffects(state, effects, context);
}

/**
 * Check if an executor exists for an effect type
 */
export function hasExecutor(effectType: EffectType): boolean {
  return executorRegistry.has(effectType);
}

/**
 * Get all registered effect types
 */
export function getRegisteredEffectTypes(): EffectType[] {
  return Array.from(executorRegistry.keys());
}

// Re-export types for convenience
export type {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceCallback,
  ChoiceRequest,
  ChoiceOption,
  SeededRNG,
  ResolvedTarget,
} from './types';

export {
  SimpleSeededRNG,
  createTestContext,
  createAutoChoiceCallback,
} from './types';

// Re-export individual executors for direct use
export {
  executeDamage,
  executeHeal,
  executeCounter,
  executeStatus,
  executeDraw,
  executeDiscard,
  executeShuffle,
  executeSearch,
  executeSwitch,
  executeEnergy,
  executePlace,
  executePrevention,
  executeDeckManipulation,
  executeRetreatModifier,
  executeTrainerBlock,
  executePrize,
  executeReveal,
  executeChoice,
  executeCopy,
  executeRestriction,
};
