import { Effect, EffectType } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';

export interface EnergyEffect extends Effect {
  type: EffectType.Energy;
  action: 'attach' | 'discard' | 'move';
  source: 'active' | 'bench' | 'hand' | 'discard';
  count: number;
  selection: 'choose' | 'random' | 'all';
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
  const countMatch = text.match(/(\d+)個/);
  if (!countMatch) {
    return null;
  }

  const effect: EnergyEffect = {
    type: EffectType.Energy,
    target: text.includes('相手') ? 'opponent' : 'self',
    count: parseInt(countMatch[1]),
    selection: text.includes('選び') ? 'choose' : 'random',
    action: 'discard', // default
    source: 'active', // default
  };

  // Determine action
  if (text.includes('トラッシュ')) {
    effect.action = 'discard';
  } else if (text.includes('つけ')) {
    effect.action = 'attach';
  } else if (text.includes('移動')) {
    effect.action = 'move';
  }

  // Determine source
  if (text.includes('このポケモンについている')) {
    effect.source = 'active';
  } else if (text.includes('手札')) {
    effect.source = 'hand';
  } else if (text.includes('トラッシュ')) {
    effect.source = 'discard';
  }

  return effect;
}
