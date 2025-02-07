import { Effect, EffectType } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';

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

export function parseDamageModifier(
  phrase: TokenizedPhrase
): DamageModifierEffect | null {
  const { text } = phrase;

  // Check if this is a damage modifier effect
  if (!text.includes('ダメージは') || !text.includes('計算しない')) {
    return null;
  }

  const effect: DamageModifierEffect = {
    type: EffectType.Damage,
    modifier: {
      type: 'ignore',
      what: 'effects',
      target: text.includes('自分') ? 'self' : 'opponent',
      location: text.includes('バトルポケモン') ? 'active' : 'bench',
    },
  };

  return effect;
}
