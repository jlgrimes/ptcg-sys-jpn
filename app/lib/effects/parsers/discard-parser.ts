import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DiscardParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('トラッシュする');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Discard,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: {
            type: 'discard',
          },
          count: 1,
        },
      ],
    };

    return effect as Effect;
  }
}
