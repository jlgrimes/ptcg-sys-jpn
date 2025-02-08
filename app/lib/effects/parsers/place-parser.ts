import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class PlaceParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('ベンチに出す');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Place,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: {
            type: 'bench',
          },
          count: 1,
        },
      ],
    };

    return effect as Effect;
  }
}
