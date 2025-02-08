import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class BenchDamageParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('ベンチ') && this.text.includes('ダメージ');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Damage,
      value: this.parseDamageValue(),
      targets: [
        {
          type: 'pokemon',
          player: 'opponent',
          location: {
            type: 'bench',
          },
          count: this.parseCountWithAll('pokemon'),
        },
      ],
      modifiers: [
        {
          type: 'ignore',
          what: 'effects',
        },
      ],
    };

    return effect as Effect;
  }

  private parseDamageValue(): number {
    const match = this.text.match(/(\d+)ダメージ/);
    return match ? parseInt(match[1]) : 0;
  }
}
