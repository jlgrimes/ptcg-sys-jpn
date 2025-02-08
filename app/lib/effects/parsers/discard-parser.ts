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
          count: this.parseDiscardCount(),
        },
      ],
    };

    return effect as Effect;
  }

  private parseDiscardCount(): number {
    return this.text.includes('エネルギー')
      ? this.parseCount('energy')
      : this.parseCount('card');
  }
}
