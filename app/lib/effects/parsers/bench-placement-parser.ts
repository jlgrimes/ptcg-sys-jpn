import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

export class BenchPlacementParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('ベンチ') &&
      (this.text.includes('出す') || this.text.includes('置く'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const player = this.text.includes('相手') ? 'opponent' : 'self';
    const count = this.parseCount('pokemon');
    const filters = this.parseFilters();

    // Add place effect first
    effects.push(
      this.createEffect(EffectType.Place, {
        targets: [
          {
            type: 'pokemon',
            player,
            location: { type: 'bench' },
            count,
            ...(filters && { filters }),
          },
        ],
      })
    );

    // Add search effect if from deck
    if (this.text.includes('山札')) {
      effects.push(
        this.createEffect(EffectType.Search, {
          targets: [
            {
              type: 'pokemon',
              player,
              location: { type: 'deck', shuffle: true },
              count,
              ...(filters && { filters }),
            },
          ],
        })
      );
    }

    return effects;
  }

  protected parseFilters(): Filter[] | undefined {
    const filters: Filter[] = [];

    if (this.text.includes('たねポケモン')) {
      filters.push({
        type: 'card-type' as const,
        value: 'basic',
      });
    } else if (this.text.includes('1進化')) {
      filters.push({
        type: 'card-type' as const,
        value: 'stage1',
      });
    } else if (this.text.includes('2進化')) {
      filters.push({
        type: 'card-type' as const,
        value: 'stage2',
      });
    }

    return filters.length > 0 ? filters : undefined;
  }
}
