import { Effect } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';
import { EffectType } from './types';

export interface EnergyEffect extends Effect {
  type: EffectType.Energy;
  action: 'attach' | 'discard' | 'move';
  source: 'active' | 'bench' | 'hand' | 'discard';
  destination?: 'active' | 'bench' | 'hand' | 'discard';
  count: number;
  selection: 'choose' | 'random' | 'all';
  energyType?: 'basic' | 'special';
  isUpTo?: boolean;
  targetCount?: number;
}

export function parseEnergyManipulation(
  phrase: TokenizedPhrase
): EnergyEffect | null {
  const { text } = phrase;

  // Check if this is an energy manipulation effect
  if (!text.includes('エネルギー')) {
    return null;
  }

  // Extract count
  const countMatch = text.match(/(\d+)(枚|個)/);
  if (!countMatch) {
    return null;
  }

  const effect: EnergyEffect = {
    type: EffectType.Energy,
    target: text.includes('相手') ? 'opponent' : 'self',
    count: parseInt(countMatch[1]),
    selection: text.includes('選び') ? 'choose' : 'random',
    action: 'attach', // default
    source: 'discard', // default
  };

  // Determine action
  if (text.includes('トラッシュする')) {
    effect.action = 'discard';
  } else if (text.includes('つける')) {
    effect.action = 'attach';
    effect.destination = text.includes('ベンチ') ? 'bench' : 'active';
  } else if (text.includes('移動')) {
    effect.action = 'move';
  }

  // Determine source
  if (text.includes('トラッシュから')) {
    effect.source = 'discard';
  } else if (text.includes('手札')) {
    effect.source = 'hand';
  } else if (text.includes('このポケモンについている')) {
    effect.source = 'active';
  }

  // Check for energy type
  if (text.includes('基本エネルギー')) {
    effect.energyType = 'basic';
  } else if (text.includes('特殊エネルギー')) {
    effect.energyType = 'special';
  }

  // Check for "up to X" pattern
  if (text.includes('まで')) {
    effect.isUpTo = true;
  }

  // Check for target count
  const targetMatch = text.match(/(\d+)匹/);
  if (targetMatch) {
    effect.targetCount = parseInt(targetMatch[1]);
  }

  return effect;
}
