import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

export class BenchPlacementParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('ベンチ') &&
      (this.text.includes('出す') || this.text.includes('のせる'))
    );
  }

  parse(): Effect | Effect[] | null {
    if (!this.canParse()) return null;

    const player = this.text.includes('相手の') ? 'opponent' : 'self';
    const fromDeck = this.text.includes('山札から');
    const shuffle = this.text.includes('切る');
    const filters = this.parseFilters();
    const count = this.parseCount('pokemon');

    const effects: Effect[] = [];

    // Create the search effect first if searching from deck
    if (fromDeck) {
      const searchEffect: Effect = {
        type: EffectType.Search,
        targets: [
          {
            type: 'pokemon',
            player,
            location: {
              type: 'deck',
              ...(shuffle && { shuffle: true }),
            },
            count,
            ...(filters && { filters }),
          },
        ],
      };
      effects.push(searchEffect);
    }

    // Then create the place effect
    const placeEffect: Effect = {
      type: EffectType.Place,
      targets: [
        {
          type: 'pokemon',
          player,
          location: {
            type: 'bench',
          },
          count,
          ...(filters && { filters }),
        },
      ],
    };
    effects.push(placeEffect);

    // Return single effect if not from deck, otherwise return array
    return fromDeck ? effects : placeEffect;
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
