import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

export class BenchPlacementParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('ベンチ') &&
      (this.text.includes('出す') || this.text.includes('のせる'))
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const player = this.text.includes('相手の') ? 'opponent' : 'self';
    const fromDeck = this.text.includes('山札から');
    const shuffle = this.text.includes('切る');
    const filters = this.parseFilters();
    const count = this.parseCount('pokemon');

    // Create the place effect
    const placeEffect: Effect = {
      type: EffectType.Place,
      targets: [
        {
          type: 'pokemon',
          player,
          location: {
            type: 'bench',
            ...(fromDeck && shuffle && { shuffle: true }),
          },
          count,
          ...(filters && { filters }),
        },
      ],
    };

    return placeEffect;
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
