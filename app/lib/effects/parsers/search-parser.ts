import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class SearchParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('探す') ||
      (this.text.includes('山札') && this.text.includes('選び'))
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Search,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: {
            type: 'deck',
            shuffle: this.text.includes('切る'),
          },
          count: 1,
        },
      ],
    };

    return effect as Effect;
  }
}
