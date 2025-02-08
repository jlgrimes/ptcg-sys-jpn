import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

export class EnergyParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('エネルギー');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Energy,
      targets: [
        {
          type: 'pokemon',
          player: 'self',
          location: {
            type: this.text.includes('トラッシュ') ? 'discard' : 'bench',
          },
          count: this.getEnergyCount(),
          filters: this.parseFilters(),
        },
      ],
    };

    return effect as Effect;
  }

  private getEnergyCount(): number {
    return this.parseCount('energy');
  }

  protected parseFilters(): Filter[] | undefined {
    const filters: Filter[] = [];

    if (this.text.includes('基本エネルギー')) {
      filters.push({
        type: 'card-type' as const,
        value: 'basic',
      });
    }

    return filters.length > 0 ? filters : undefined;
  }
}
