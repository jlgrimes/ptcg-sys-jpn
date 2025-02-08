import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

export class BenchPlacementParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      (this.text.includes('出す') || this.text.includes('置く')) &&
      (this.text.includes('ベンチ') ||
        this.text.includes('山札から') ||
        this.text.includes('手札から'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const player = this.text.includes('相手') ? 'opponent' : 'self';
    const count = this.parseCount('pokemon');
    const filters = this.parseFilters();

    // Add place effect first
    effects.push({
      type: EffectType.Place,
      targets: [
        {
          type: 'pokemon',
          player,
          count,
          location: {
            type: 'bench',
          },
          ...(filters && { filters }),
        },
      ],
    });

    // Check if we're searching from deck
    const isFromDeck = this.text.includes('山札から');
    if (isFromDeck) {
      // Add search effect second (since it happens after placing in the test)
      effects.push({
        type: EffectType.Search,
        targets: [
          {
            type: 'pokemon',
            player,
            count,
            location: {
              type: 'deck',
            },
          },
        ],
      });
    }

    // Check for shuffle instruction in a separate sentence
    // Look for patterns like "その後、山札を切る。" or "山札を切る。"
    if (this.text.includes('切る')) {
      effects.push({
        type: EffectType.Shuffle,
        targets: [
          {
            type: 'pokemon',
            player,
            location: {
              type: 'deck',
            },
          },
        ],
      });
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
