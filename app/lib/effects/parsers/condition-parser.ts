import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class ConditionParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('なら、このワザは失敗');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const prizeMatch = this.text.match(/(\d+)枚/g);
    if (!prizeMatch) return null;

    const values = prizeMatch.map(m => parseInt(m));

    const effect: Partial<Effect> = {
      type: EffectType.Condition,
      targets: [
        {
          type: 'pokemon',
          player: 'opponent',
          location: {
            type: 'prize',
          },
        },
      ],
      conditions: [
        {
          type: 'card-count',
          values,
          comparison: 'not-equal',
          onFailure: [
            {
              type: EffectType.MoveFailure,
            },
          ],
        },
      ],
    };

    return effect as Effect;
  }
}
