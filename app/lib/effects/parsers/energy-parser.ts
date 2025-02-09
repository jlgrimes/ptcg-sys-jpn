import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class EnergyParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('エネルギー') &&
      (this.text.includes('つける') || this.text.includes('トラッシュ'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const player = this.text.includes('相手の') ? 'opponent' : 'self';
    const count = this.parseCount('energy');
    const filters = this.text.includes('基本エネルギー')
      ? [{ type: 'card-type' as const, value: 'basic' }]
      : undefined;

    if (this.text.includes('トラッシュする')) {
      effects.push(
        this.createEffect(EffectType.Discard, {
          targets: [
            {
              type: 'energy',
              player,
              location: { type: 'discard' },
              count,
            },
          ],
        })
      );
      return effects;
    }

    // Handle search effect for energy from hand or discard
    const searchLocation = this.text.includes('トラッシュから')
      ? 'discard'
      : this.text.includes('手札から')
      ? 'hand'
      : undefined;
    if (searchLocation) {
      effects.push(
        this.createEffect(EffectType.Search, {
          targets: [
            {
              type: 'energy',
              player,
              location: { type: searchLocation },
              count,
              ...(filters && { filters }),
            },
          ],
          ...(this.text.includes('何回でも使える') && {
            timing: {
              type: 'continuous',
              duration: 'turn',
            },
          }),
        })
      );
    }

    // Parse target Pokemon filters
    const pokemonFilters = [];
    const pokemonNameMatch = this.text.match(/「([^」]+)のポケモン」/);
    if (pokemonNameMatch) {
      pokemonFilters.push({
        type: 'card-type' as const,
        value: pokemonNameMatch[1],
      });
    }

    effects.push(
      this.createEffect(EffectType.Energy, {
        targets: [
          {
            type: 'pokemon',
            player,
            location: {
              type:
                pokemonFilters.length > 0
                  ? 'field'
                  : this.text.includes('ベンチ')
                  ? 'bench'
                  : 'active',
            },
            count,
            ...(pokemonFilters.length > 0 && { filters: pokemonFilters }),
          },
        ],
        ...(this.text.includes('何回でも使える') && {
          timing: {
            type: 'continuous',
            duration: 'turn',
          },
        }),
      })
    );

    return effects;
  }
}
