import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

export class CountDamageParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('数') && this.text.includes('ダメージ');
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
            type: 'active',
          },
        },
      ],
      conditions: [
        {
          type: 'card-count',
          target: {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: this.text.includes('手札') ? 'hand' : 'field',
              reveal: this.text.includes('見る'),
            },
            filters: this.parseCountFilters(),
          },
        },
      ],
    };

    return effect as Effect;
  }

  private parseDamageValue(): number {
    const match = this.text.match(/×(\d+)ダメージ/);
    return match ? parseInt(match[1]) : 0;
  }

  private parseCountFilters(): Filter[] {
    return [
      {
        type: 'card-type' as const,
        value: this.text.includes('トレーナーズ')
          ? 'トレーナーズ'
          : 'ポケモンex',
      },
    ];
  }
}
