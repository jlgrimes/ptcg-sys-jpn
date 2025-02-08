import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

export class PlaceParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('ベンチに出す');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Place,
      targets: [
        {
          type: 'pokemon',
          player: this.text.includes('相手の') ? 'opponent' : 'self',
          location: {
            type: 'bench',
            shuffle: this.text.includes('切る'),
          },
          count: this.text.includes('まで') ? 2 : 1,
          filters: this.parseFilters(),
        },
      ],
    };

    return effect as Effect;
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
