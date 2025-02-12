import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

export class CopyParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('ワザを') && this.text.includes('このワザとして使う')
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const moveCount = this.parseMoveCount();
    const filters = this.parsePokemonFilters();

    effects.push(
      this.createEffect(EffectType.Copy, {
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: { type: 'bench' },
            count: 1,
            filters: filters,
          },
        ],
        what: 'move',
        count: moveCount,
      })
    );

    return effects;
  }

  private parsePokemonFilters(): Filter[] | undefined {
    const filters: Filter[] = [];
    const nameMatch = this.text.match(/「([^」]+)」/);

    if (nameMatch) {
      filters.push({
        type: 'card-type',
        value: nameMatch[1],
      });
    }

    return filters.length > 0 ? filters : undefined;
  }

  private parseMoveCount(): number {
    const match = this.text.match(/(\d+)つ/);
    return match ? parseInt(match[1]) : 1;
  }
}
