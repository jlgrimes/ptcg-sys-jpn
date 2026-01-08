/**
 * Trainer block executor - blocks opponent from playing certain trainer cards
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, TrainerBlockEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
} from './types';

/**
 * Execute a trainer block effect
 * Note: This sets a flag that would be checked when playing trainer cards
 * Full implementation would require tracking active blocks in GameState
 */
export async function executeTrainerBlock(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const blockEffect = effect as TrainerBlockEffect;
  const blockType = blockEffect.blockType || 'all-trainers';
  const duration = blockEffect.duration || 'next-turn';

  // In a full implementation, we would add a "trainerBlocks" array to GameState
  // that tracks active blocking effects
  // For now, just log the effect

  let typeLabel: string;
  switch (blockType) {
    case 'goods':
      typeLabel = 'Item cards';
      break;
    case 'supporter':
      typeLabel = 'Supporter cards';
      break;
    case 'stadium':
      typeLabel = 'Stadium cards';
      break;
    case 'tool':
      typeLabel = 'Tool cards';
      break;
    case 'all-trainers':
      typeLabel = 'Trainer cards';
      break;
    default:
      typeLabel = blockType;
  }

  const durationLabel = duration === 'next-turn' ? "opponent's next turn" : 'while this Pokemon is active';

  const messages: ExecutionMessage[] = [{
    type: 'info',
    message: `Opponent cannot play ${typeLabel} during ${durationLabel}`,
    data: {
      blockType,
      duration,
    },
  }];

  // TODO: Actually store the block state in GameState

  return { state, messages };
}

export const trainerBlockExecutor = {
  effectType: EffectType.TrainerBlock,
  execute: executeTrainerBlock,
};
