import { BaseParser } from './base-parser';
import { Effect, EffectType, Filter } from '../types';

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
    const count = this.parseCount();
    const filters = this.parseEnergyFilters();
    const timing = this.parseTiming();

    // If it's a discard effect
    if (this.text.includes('トラッシュする')) {
      effects.push(
        this.createEffect(EffectType.Discard, {
          targets: [
            {
              type: 'energy',
              player: this.parseSourcePlayer(),
              location: { type: 'discard' },
              count: count,
            },
          ],
        })
      );
      return effects;
    }

    // If we're attaching from discard/hand/deck, we need a search effect first
    const sourceLocation = this.parseSourceLocation();
    if (sourceLocation.type !== 'active') {
      effects.push(
        this.createEffect(EffectType.Search, {
          targets: [
            {
              type: 'energy',
              player: this.parseSourcePlayer(),
              location: sourceLocation,
              count: count,
              filters: filters,
            },
          ],
          timing: timing,
        })
      );
    }

    // Then add the energy attach effect
    effects.push(
      this.createEffect(EffectType.Energy, {
        targets: [
          {
            type: 'pokemon',
            player: this.parseTargetPlayer(),
            location: this.parseTargetLocation(),
            count: this.parseTargetCount(),
            filters: this.parsePokemonFilters(),
          },
        ],
        timing: timing,
      })
    );

    return effects;
  }

  protected parseCount(): number {
    const match = this.text.match(/(\d+)(枚|個)/);
    if (match) {
      if (this.text.includes('まで')) {
        return parseInt(match[1]); // "Up to X" is handled as max count
      }
      return parseInt(match[1]);
    }
    return 1;
  }

  private parseSourcePlayer(): 'self' | 'opponent' {
    return this.text.includes('相手') ? 'opponent' : 'self';
  }

  private parseTargetPlayer(): 'self' | 'opponent' {
    // For now, target is always the same as source player
    return this.parseSourcePlayer();
  }

  private parseSourceLocation(): {
    type: 'deck' | 'hand' | 'discard' | 'active';
  } {
    if (this.text.includes('トラッシュ')) {
      return { type: 'discard' };
    }
    if (this.text.includes('手札')) {
      return { type: 'hand' };
    }
    if (this.text.includes('山札')) {
      return { type: 'deck' };
    }
    return { type: 'active' };
  }

  private parseTargetLocation(): { type: 'bench' | 'active' | 'field' } {
    if (this.text.includes('ベンチ')) {
      return { type: 'bench' };
    }
    // If there's a Pokemon name filter, it can be anywhere on the field
    if (this.text.match(/「[^」]+のポケモン」/)) {
      return { type: 'field' };
    }
    return { type: 'active' };
  }

  private parseTargetCount(): number {
    const match = this.text.match(/(\d+)匹/);
    return match ? parseInt(match[1]) : 1;
  }

  private parseEnergyFilters(): Filter[] | undefined {
    const filters: Filter[] = [];

    // Check for specific energy name in quotes
    const nameMatch = this.text.match(/「([^」]+)」/);
    if (nameMatch && nameMatch[1].includes('エネルギー')) {
      filters.push({
        type: 'energy-type',
        value: nameMatch[1],
        subtype: this.text.includes('基本') ? 'basic' : 'special',
      });
    }
    // Check for basic/special energy type without specific name
    else if (this.text.includes('基本エネルギー')) {
      filters.push({
        type: 'energy-type',
        value: '基本エネルギー',
        subtype: 'basic',
      });
    }

    return filters.length > 0 ? filters : undefined;
  }

  private parsePokemonFilters(): Filter[] | undefined {
    const filters: Filter[] = [];
    const nameMatch = this.text.match(/「([^」]+)のポケモン」/);
    if (nameMatch) {
      filters.push({
        type: 'card-type',
        value: nameMatch[1],
      });
    }
    return filters.length > 0 ? filters : undefined;
  }

  private parseTiming() {
    if (this.text.includes('進化させたとき')) {
      return {
        type: 'on-evolution' as const,
      };
    }
    if (this.text.includes('何回でも使える')) {
      return {
        type: 'continuous' as const,
        duration: 'turn' as const,
      };
    }
    return undefined;
  }
}
