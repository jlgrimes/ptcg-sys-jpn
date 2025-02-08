import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class EnergyParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('エネルギー');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Energy,
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
