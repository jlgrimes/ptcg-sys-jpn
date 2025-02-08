import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class CountDamageParser extends BaseParser<Effect> {
  canParse(): boolean {
    // Only parse if it's about counting something for damage
    return (
      this.text.includes('×') &&
      this.text.includes('ダメージ') &&
      (this.text.includes('の数') || this.text.includes('の枚数')) &&
      !this.text.includes('効果を計算しない') // Avoid matching when it's about effect calculation
    );
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
              ...(this.text.includes('見る') && { reveal: true }),
            },
            filters: [
              {
                type: 'card-type',
                value: this.parseCardType(),
              },
            ],
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

  private parseCardType(): string {
    if (this.text.includes('ポケモンex')) return 'ポケモンex';
    if (this.text.includes('トレーナーズ')) return 'トレーナーズ';
    return '';
  }
}
