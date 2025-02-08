import { BaseParser } from './base-parser';
import { Effect, EffectType, Condition } from '../types';

export class SearchParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('探す') ||
      (this.text.includes('山札') && this.text.includes('選び'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const count = this.parseCount('card');
    const player = this.text.includes('相手の') ? 'opponent' : 'self';
    const type = this.text.includes('トレーナーズ') ? 'trainer' : 'pokemon';
    const filters = this.parseFilters();
    const conditions = this.parseSearchConditions();
    const shouldReveal = this.text.includes('見せて');
    const shouldShuffle = this.text.includes('切る');
    const isOncePerTurn = this.text.includes('自分の番に1回使える');

    // Add search effect
    effects.push(
      this.createEffect(EffectType.Search, {
        targets: [
          {
            type,
            player,
            location: {
              type: 'deck',
              ...(shouldReveal && { reveal: true }),
              ...(isOncePerTurn && shouldShuffle && { shuffle: true }),
            },
            count,
            ...(filters && { filters }),
          },
        ],
        ...(conditions && { conditions }),
      })
    );

    // Add separate shuffle effect if needed
    if (shouldShuffle && !isOncePerTurn) {
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

  protected parseSearchConditions(): Condition[] | undefined {
    const conditions: Condition[] = [];

    // Check for Terastal condition
    if (this.text.includes('テラスタル')) {
      conditions.push({
        type: 'card-count' as const,
        target: {
          type: 'pokemon',
          player: 'self',
          location: {
            type: 'field',
          },
          filters: [
            {
              type: 'card-type',
              value: 'テラスタル',
            },
          ],
        },
      });
    }

    return conditions.length > 0 ? conditions : undefined;
  }
}
