import { Effect, EffectType } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';

interface CountMultiplier {
  type: 'count';
  target: 'self' | 'opponent';
  condition: string;
  location: 'field' | 'bench' | 'discard' | 'hand';
}

export interface CountDamageEffect extends Effect {
  type: EffectType.Damage;
  value: number;
  multiplier?: CountMultiplier;
}

export function parseCountDamage(
  phrase: TokenizedPhrase
): CountDamageEffect | null {
  const { text } = phrase;

  // Check if this is a count-based damage effect
  const damageMatch = text.match(/(\d+)ダメージ/);
  const multiplierMatch = text.match(/([^×]+)×(\d+)ダメージ/);

  if (!multiplierMatch || !damageMatch) {
    return null;
  }

  const effect: CountDamageEffect = {
    type: EffectType.Damage,
    value: parseInt(multiplierMatch[2]),
    target: text.includes('自分') ? 'self' : 'opponent',
    location: 'active',
  };

  // Extract the counting condition
  const countCondition = multiplierMatch[1].trim();
  const quoteMatch = countCondition.match(/「([^」]+)」/);

  // Check for hand reveal
  if (text.includes('手札を見る')) {
    effect.revealLocation = 'hand';
  }

  if (quoteMatch || text.includes('トレーナーズ')) {
    effect.multiplier = {
      type: 'count',
      target: text.includes('自分の') ? 'self' : 'opponent',
      condition: quoteMatch ? quoteMatch[1] : 'トレーナーズ',
      location: text.includes('場')
        ? 'field'
        : text.includes('トラッシュ')
        ? 'discard'
        : 'hand',
    };
  }

  return effect;
}
