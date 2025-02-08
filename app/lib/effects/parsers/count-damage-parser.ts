import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

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

    const damageValue = this.parseDamageValue();
    if (damageValue === 0) return null;

    return this.createEffect(EffectType.Damage, {
      value: damageValue,
      targets: [
        {
          type: 'pokemon',
          player: 'opponent',
          location: { type: 'active' },
        },
      ],
      conditions: [
        {
          type: 'card-count',
          target: {
            type: this.text.includes('トレーナーズ') ? 'trainer' : 'pokemon',
            player: 'opponent',
            location: {
              type: this.text.includes('手札') ? 'hand' : 'field',
              ...(this.text.includes('見る') && { reveal: true }),
            },
            filters: this.parseCardTypeFilters(),
          },
        },
      ],
    });
  }

  private parseCardTypeFilters(): Filter[] | undefined {
    const filters: Filter[] = [];
    if (this.text.includes('ポケモンex')) {
      filters.push({ type: 'card-type' as const, value: 'ポケモンex' });
    }
    if (this.text.includes('トレーナーズ')) {
      filters.push({ type: 'card-type' as const, value: 'トレーナーズ' });
    }
    return filters.length > 0 ? filters : undefined;
  }
}
