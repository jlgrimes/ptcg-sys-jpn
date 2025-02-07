import { Effect, EffectType } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';

export function parseDiscardDraw(phrase: TokenizedPhrase): Effect[] | null {
  const { text } = phrase;

  // Check if this is a discard-then-draw effect
  if (!text.includes('トラッシュする') || !text.includes('引く')) {
    return null;
  }

  const effects: Effect[] = [];

  // Parse discard effect
  const discardMatch = text.match(/(\d+)枚トラッシュする/);
  if (discardMatch) {
    effects.push({
      type: EffectType.Discard,
      target: text.includes('相手') ? 'opponent' : 'self',
      source: 'hand',
      count: parseInt(discardMatch[1]),
      selection: 'choose',
    });
  }

  // Parse draw effect
  const drawMatch = text.match(/(\d+)枚引く/);
  if (drawMatch) {
    effects.push({
      type: EffectType.Draw,
      target: text.includes('相手') ? 'opponent' : 'self',
      count: parseInt(drawMatch[1]),
    });
  }

  return effects.length > 0 ? effects : null;
}
