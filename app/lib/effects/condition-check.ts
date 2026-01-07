import { Effect } from '../effect-parser';
import type { TokenizedPhrase } from '../effect-parser';
import { EffectType } from './types';

interface PrizeCountCheck {
  type: 'prize-count';
  target: 'self' | 'opponent';
  values: number[];
  comparison: 'equal' | 'not-equal' | 'greater' | 'less';
}

export interface ConditionCheckEffect extends Effect {
  type: EffectType.Condition;
  result: 'fail' | 'success';
  check: PrizeCountCheck;
}

export function parseConditionCheck(
  phrase: TokenizedPhrase
): ConditionCheckEffect | null {
  const { text } = phrase;

  // Check if this is a condition check effect
  if (!text.includes('なら、このワザは')) {
    return null;
  }

  // Check for prize card count condition
  if (text.includes('サイドの残り枚数')) {
    const values = text.match(/(\d+)枚/g)?.map(n => parseInt(n)) || [];

    return {
      type: EffectType.Condition,
      result: text.includes('失敗') ? 'fail' : 'success',
      check: {
        type: 'prize-count',
        target: text.includes('相手の') ? 'opponent' : 'self',
        values,
        comparison: text.includes('でない') ? 'not-equal' : 'equal',
      },
    };
  }

  return null;
}
