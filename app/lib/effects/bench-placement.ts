import { Effect, EffectType } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';

export function parseBenchPlacement(phrase: TokenizedPhrase): Effect | null {
  const { text } = phrase;

  // Check if this is a bench placement effect
  if (!text.includes('ベンチに出す')) {
    return null;
  }

  const effect: Effect = {
    type: EffectType.Place,
    target: text.includes('相手') ? 'opponent' : 'self',
    destination: 'bench',
    selection: text.includes('選び') ? 'choose' : 'random',
    shuffle: text.includes('山札を切る'),
  };

  // Extract count
  const countMatch = text.match(/(\d+)枚/);
  if (countMatch) {
    effect.count = parseInt(countMatch[1]);
  }

  // Determine source
  if (text.includes('山札から')) {
    effect.source = 'deck';
  } else if (text.includes('手札から')) {
    effect.source = 'hand';
  }

  // Determine card type
  if (text.includes('たねポケモン')) {
    effect.cardType = 'basic';
  } else if (text.includes('1進化')) {
    effect.cardType = 'stage1';
  } else if (text.includes('2進化')) {
    effect.cardType = 'stage2';
  }

  return effect;
}
