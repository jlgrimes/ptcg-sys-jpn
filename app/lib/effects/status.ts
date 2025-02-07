import { Effect, EffectType } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';

export function parseStatus(phrase: TokenizedPhrase): Effect | null {
  const { text } = phrase;

  // Check for coin flip status effects
  const damageMatch = text.match(/(\d+)ダメージ/);
  const coinFlipMatch = text.match(/コインを(\d+)回投げ/);
  const statusMatch = text.includes('マヒ状態');

  if (damageMatch && coinFlipMatch && statusMatch) {
    return {
      type: EffectType.Damage,
      value: parseInt(damageMatch[1]),
      target: 'opponent',
      location: 'active',
      coinFlip: {
        count: parseInt(coinFlipMatch[1]),
        onHeads: {
          type: EffectType.Status,
          status: 'paralyzed',
          target: 'opponent',
          location: 'active',
        },
      },
    };
  }

  return null;
}
