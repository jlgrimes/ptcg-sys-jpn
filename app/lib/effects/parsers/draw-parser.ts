import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DrawParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('引く');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Draw,
      value: this.parseDrawCount(),
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: {
            type: 'deck',
          },
        },
      ],
    };

    return effect as Effect;
  }

  protected parseDrawCount(): number {
    const match = this.text.match(/(\d+)枚引く/);
    return match ? parseInt(match[1]) : 1;
  }
}
