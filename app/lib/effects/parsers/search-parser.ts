import { BaseEffectParser } from './utils/base-effect-parser';
import { Effect, EffectType } from '../types';
import { TextMatcher } from './utils/text-matcher';
import { EffectBuilder } from './utils/effect-builder';

export class SearchParser extends BaseEffectParser<Effect> {
  canParse(): boolean {
    return this.matcher.hasAny(...TextMatcher.patterns.actions.search);
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const count = this.parseCount('card');
    const player = this.parsePlayer();
    const type = this.matcher.hasAny(...TextMatcher.patterns.cardTypes.trainer)
      ? 'trainer'
      : 'pokemon';
    const filters = this.parseFilters();
    const conditions = this.parseSearchConditions();
    const shouldReveal = this.matcher.hasAny(
      ...TextMatcher.patterns.actions.reveal
    );
    const shouldShuffle = this.matcher.hasAny(
      ...TextMatcher.patterns.actions.shuffle
    );
    const isOncePerTurn = this.matcher.hasAny(
      ...TextMatcher.patterns.timing.oncePerTurn
    );

    // Add search effect
    effects.push(
      this.createEffect(EffectType.Search, {
        targets: [
          EffectBuilder.createTarget(
            type,
            player,
            EffectBuilder.createLocation('deck', {
              ...(shouldReveal && { reveal: true }),
              ...(isOncePerTurn && shouldShuffle && { shuffle: true }),
            }),
            {
              count,
              ...(filters && { filters }),
            }
          ),
        ],
        ...(conditions && { conditions }),
      })
    );

    // Add separate shuffle effect if needed
    if (shouldShuffle && !isOncePerTurn) {
      effects.push(
        this.createEffect(EffectType.Shuffle, {
          targets: [
            EffectBuilder.createTarget(
              'pokemon',
              player,
              EffectBuilder.createLocation('deck')
            ),
          ],
        })
      );
    }

    return effects;
  }

  protected parseSearchConditions() {
    const conditions = [];

    if (this.matcher.hasAny(...TextMatcher.patterns.cardTypes.pokemonEx)) {
      conditions.push(
        EffectBuilder.createCondition('card-count', {
          target: EffectBuilder.createTarget(
            'pokemon',
            'self',
            EffectBuilder.createLocation('field'),
            {
              filters: [EffectBuilder.createFilter('card-type', 'テラスタル')],
            }
          ),
        })
      );
    }

    return conditions.length > 0 ? conditions : undefined;
  }
}
