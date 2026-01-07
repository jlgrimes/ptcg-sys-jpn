import { Effect } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';
import { EffectType } from './types';

interface DamageModifier {
  type: 'ignore' | 'double' | 'half';
  what: 'effects' | 'weakness' | 'resistance';
  target: 'self' | 'opponent';
  location: 'active' | 'bench';
}

export interface DamageModifierEffect extends Effect {
  type: EffectType.Damage;
  modifier: DamageModifier;
}

export function parseDamageModifier(phrase: TokenizedPhrase): Effect | null {
  const { text } = phrase;

  // Check if this is a damage modifier effect
  if (!text.includes('ダメージは') || !text.includes('計算しない')) {
    return null;
  }

  // Extract damage value if present
  const damageMatch = text.match(/(\d+)ダメージ/);

  const effect: Effect = {
    type: EffectType.Damage,
    target: 'opponent',
    location: 'active',
    modifier: {
      type: 'ignore',
      what: 'effects',
      target: text.includes('自分') ? 'self' : 'opponent',
      location: 'active',
    },
  };

  if (damageMatch) {
    effect.value = parseInt(damageMatch[1]);
  }

  return effect;
}
