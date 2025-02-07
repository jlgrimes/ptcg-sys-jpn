import { Effect, EffectType } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';

export interface BenchDamageEffect extends Effect {
  type: EffectType.Damage;
  value: number;
  location: 'bench';
  count: number | 'all';
  ignoreWeaknessResistance: boolean;
}

export function parseBenchDamage(
  phrase: TokenizedPhrase
): BenchDamageEffect | null {
  const { text } = phrase;

  // Check if this is a bench damage effect
  if (!text.includes('ベンチポケモン') || !text.includes('ダメージ')) {
    return null;
  }

  // Extract damage amount
  const damageMatch = text.match(/(\d+)ダメージ/);
  if (!damageMatch) {
    return null;
  }

  const effect: BenchDamageEffect = {
    type: EffectType.Damage,
    value: parseInt(damageMatch[1]),
    target: text.includes('自分') ? 'self' : 'opponent',
    location: 'bench',
    count: 1, // default
    ignoreWeaknessResistance: false,
  };

  // Determine if it affects all bench Pokemon
  if (text.includes('全員') || text.includes('すべて')) {
    effect.count = 'all';
  } else {
    const countMatch = text.match(/(\d+)匹/);
    if (countMatch) {
      effect.count = parseInt(countMatch[1]);
    }
  }

  // Check for weakness/resistance rule
  const bracketMatch = text.match(/［([^］]+)］/);
  if (bracketMatch && bracketMatch[1].includes('弱点・抵抗力を計算しない')) {
    effect.ignoreWeaknessResistance = true;
  }

  return effect;
}
