/**
 * Choice executor - lets player choose between different effect options
 */

import { GameState } from '../../notation/training-format';
import { Effect, EffectType, ChoiceEffect } from '../types';
import {
  ExecutionContext,
  ExecutionResult,
  ExecutionMessage,
  ChoiceRequest,
} from './types';

/**
 * Execute a choice effect
 */
export async function executeChoice(
  state: GameState,
  effect: Effect,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const choiceEffect = effect as ChoiceEffect;
  const options = choiceEffect.options || [];
  const choiceCount = choiceEffect.choiceCount || 1;

  if (options.length === 0) {
    return { state, messages: [] };
  }

  // If only one option, auto-select it
  if (options.length === 1) {
    return {
      state,
      messages: [{
        type: 'info',
        message: 'Only one option available - auto-selected',
        data: {},
      }],
      pendingEffects: options[0],
    };
  }

  // Create choice request
  const choiceRequest: ChoiceRequest = {
    type: 'select-option',
    player: 'self',
    options: options.map((effectSequence, i) => ({
      id: `option_${i}`,
      label: describeEffectSequence(effectSequence),
      data: effectSequence,
    })),
    minSelections: choiceCount,
    maxSelections: choiceCount,
    message: choiceCount === 1
      ? 'Choose one option'
      : `Choose ${choiceCount} options`,
  };

  const selectedIndices = await context.chooseForSelf(choiceRequest);

  // Collect all selected effect sequences
  const selectedEffects: Effect[] = [];
  const selectedLabels: string[] = [];

  for (const index of selectedIndices) {
    selectedEffects.push(...options[index]);
    selectedLabels.push(describeEffectSequence(options[index]));
  }

  return {
    state,
    messages: [{
      type: 'info',
      message: `Chose: ${selectedLabels.join(' and ')}`,
      data: { choices: selectedIndices },
    }],
    pendingEffects: selectedEffects,
  };
}

/**
 * Create a human-readable description of an effect sequence
 */
function describeEffectSequence(effects: Effect[]): string {
  if (effects.length === 0) return 'Do nothing';

  const descriptions: string[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case EffectType.Damage:
        descriptions.push(`Deal ${effect.value || '?'} damage`);
        break;
      case EffectType.Draw:
        descriptions.push(`Draw ${effect.value || '?'} card(s)`);
        break;
      case EffectType.Heal:
        descriptions.push(`Heal ${effect.value || '?'} HP`);
        break;
      case EffectType.Status:
        descriptions.push(`Apply ${effect.status || 'status'}`);
        break;
      case EffectType.Search:
        descriptions.push('Search deck');
        break;
      case EffectType.Discard:
        descriptions.push('Discard card(s)');
        break;
      case EffectType.Switch:
        descriptions.push('Switch Pokemon');
        break;
      case EffectType.Energy:
        descriptions.push(`${effect.action || 'Energy'} energy`);
        break;
      default:
        descriptions.push(effect.type);
    }
  }

  return descriptions.join(', ');
}

export const choiceExecutor = {
  effectType: EffectType.Choice,
  execute: executeChoice,
};
