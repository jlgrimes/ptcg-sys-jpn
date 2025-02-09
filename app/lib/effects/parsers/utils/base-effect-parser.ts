import { TokenizedPhrase } from '../../../effect-parser';
import {
  BaseEffect,
  Effect,
  EffectType,
  Location,
  Filter,
  Condition,
  Timing,
} from '../../types';
import { TextMatcher } from './text-matcher';
import { EffectBuilder } from './effect-builder';

export abstract class BaseEffectParser<T extends BaseEffect> {
  protected matcher: TextMatcher;
  protected timing?: Timing;

  constructor(phrase: TokenizedPhrase) {
    this.matcher = new TextMatcher(phrase.text);
    this.timing = phrase.timing;
  }

  abstract canParse(): boolean;
  abstract parse(): T | T[] | null;

  protected createEffect(type: EffectType, props: Partial<Omit<T, 'type'>>): T {
    return {
      type,
      ...props,
      ...(this.timing && { timing: this.timing }),
    } as T;
  }

  protected parsePlayer(): 'self' | 'opponent' {
    return this.matcher.hasAny(...TextMatcher.patterns.targets.opponent)
      ? 'opponent'
      : 'self';
  }

  protected parseLocation(defaultType: Location['type'] = 'active'): Location {
    const type = this.getLocationType() || defaultType;
    return EffectBuilder.createLocation(type, {
      reveal: this.matcher.hasAny(...TextMatcher.patterns.actions.reveal),
      shuffle: this.matcher.hasAny(...TextMatcher.patterns.actions.shuffle),
    });
  }

  protected getLocationType(): Location['type'] | undefined {
    if (this.matcher.hasAny(...TextMatcher.patterns.locations.bench))
      return 'bench';
    if (this.matcher.hasAny(...TextMatcher.patterns.locations.hand))
      return 'hand';
    if (this.matcher.hasAny(...TextMatcher.patterns.locations.deck))
      return 'deck';
    if (this.matcher.hasAny(...TextMatcher.patterns.locations.discard))
      return 'discard';
    if (this.matcher.hasAny(...TextMatcher.patterns.locations.active))
      return 'active';
    return undefined;
  }

  protected parseCount(type: 'card' | 'pokemon' | 'energy'): number {
    const patterns = {
      card: TextMatcher.patterns.numbers.cardCount,
      pokemon: TextMatcher.patterns.numbers.pokemonCount,
      energy: TextMatcher.patterns.numbers.energyCount,
    };
    const match = this.matcher.matchNumber(patterns[type]);
    return match ? parseInt(match, 10) : 1;
  }

  protected parseFilters(): Filter[] | undefined {
    const filters: Filter[] = [];

    // Add filters based on text patterns
    if (this.matcher.hasAny(...TextMatcher.patterns.cardTypes.basic)) {
      filters.push({ type: 'card-type', value: 'basic' });
    }
    if (this.matcher.hasAny(...TextMatcher.patterns.cardTypes.stage1)) {
      filters.push({ type: 'card-type', value: 'stage1' });
    }
    if (this.matcher.hasAny(...TextMatcher.patterns.cardTypes.stage2)) {
      filters.push({ type: 'card-type', value: 'stage2' });
    }
    // Add more filter patterns as needed

    return filters.length > 0 ? filters : undefined;
  }

  protected parseDamageValue(): number {
    const match = this.matcher.matchNumber(
      TextMatcher.patterns.numbers.damageCount
    );
    return match ? parseInt(match, 10) : 0;
  }

  protected parseCoinFlipCount(): number {
    const match = this.matcher.matchNumber(
      TextMatcher.patterns.numbers.coinFlips
    );
    return match ? parseInt(match, 10) : 1;
  }

  protected createCoinFlipCondition(
    onSuccess?: Effect[],
    onFailure?: Effect[]
  ): Condition {
    return EffectBuilder.createCondition('coin-flip', {
      value: this.parseCoinFlipCount(),
      ...(onSuccess && { onSuccess }),
      ...(onFailure && { onFailure }),
    });
  }
}
