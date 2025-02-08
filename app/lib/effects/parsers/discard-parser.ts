import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DiscardParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('トラッシュ') &&
      (this.text.includes('枚') || this.text.includes('個'))
    );
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
          count: this.parseCount(),
        },
      ],
    };

    return effect as Effect;
  }

  protected parseCount(): number {
    const match = this.text.match(/(\d+)(枚|個)/);
    return match ? parseInt(match[1]) : 1;
  }
}
