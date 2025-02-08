import { TokenizedPhrase } from '../../effect-parser';
import {
  Effect,
  Target,
  Location,
  Filter,
  Condition,
  Modifier,
  EffectType,
} from '../types';
import * as kuromoji from 'kuromoji';

export abstract class BaseParser<T extends Effect = Effect> {
  protected text: string;
  protected tokens: TokenizedPhrase['tokens'];
  protected timing?: TokenizedPhrase['timing'];

  constructor(phrase: TokenizedPhrase) {
    this.text = phrase.text;
    this.tokens = phrase.tokens;
    this.timing = phrase.timing;
  }

  /**
   * Attempts to parse a tokenized phrase into an effect
   * @returns The parsed effect or null if the phrase doesn't match this parser
   */
  abstract parse(): T | T[] | null;

  /**
   * Checks if the current phrase can be parsed by this parser
   */
  abstract canParse(): boolean;

  /**
   * Checks if a token matches any of the given parts of speech
   */
  protected isPartOfSpeech(
    token: kuromoji.IpadicFeatures,
    ...pos: string[]
  ): boolean {
    return pos.includes(token.pos);
  }

  /**
   * Checks if a token matches the given reading
   */
  protected hasReading(
    token: kuromoji.IpadicFeatures,
    reading: string
  ): boolean {
    return token.reading === reading;
  }

  /**
   * Checks if a token matches the given base form
   */
  protected hasBaseForm(
    token: kuromoji.IpadicFeatures,
    baseForm: string
  ): boolean {
    return token.basic_form === baseForm;
  }

  /**
   * Finds the next token that matches the predicate
   */
  protected findNextToken(
    tokens: kuromoji.IpadicFeatures[],
    startIndex: number,
    predicate: (token: kuromoji.IpadicFeatures) => boolean
  ): { token: kuromoji.IpadicFeatures; index: number } | null {
    for (let i = startIndex; i < tokens.length; i++) {
      if (predicate(tokens[i])) {
        return { token: tokens[i], index: i };
      }
    }
    return null;
  }

  /**
   * Extracts a number from a token's surface form
   */
  protected extractNumber(token: kuromoji.IpadicFeatures): number | null {
    const num = parseInt(token.surface_form, 10);
    return isNaN(num) ? null : num;
  }

  /**
   * Gets all tokens between two indices
   */
  protected getTokensBetween(
    tokens: kuromoji.IpadicFeatures[],
    startIndex: number,
    endIndex: number
  ): kuromoji.IpadicFeatures[] {
    return tokens.slice(startIndex + 1, endIndex);
  }

  /**
   * Joins token surface forms with optional separator
   */
  protected joinTokens(
    tokens: kuromoji.IpadicFeatures[],
    separator: string = ''
  ): string {
    return tokens.map(t => t.surface_form).join(separator);
  }

  // Enhanced common parsing methods
  protected createEffect(
    type: EffectType,
    options: Partial<Effect> = {}
  ): Effect {
    const targets = options.targets || this.parseTargets();
    const conditions = this.parseConditions();
    const modifiers = this.parseModifiers();

    return {
      type,
      ...options,
      ...(targets && { targets }),
      ...(conditions && { conditions }),
      ...(modifiers && { modifiers }),
      ...(this.timing && { timing: this.timing }),
    } as Effect;
  }

  protected parseTargets(): Target[] | undefined {
    const targets: Target[] = [];
    const targetTypes = this.getTargetTypes();

    for (const targetType of targetTypes) {
      const target: Partial<Target> = {
        type: targetType,
        player: this.parsePlayer(),
        location: this.parseLocation(),
      };

      const count = this.parseCountWithAll(targetType);
      if (count !== undefined && count !== 1) target.count = count;

      const filters = this.parseFilters();
      if (filters) target.filters = filters;

      targets.push(target as Target);
    }

    return targets.length > 0 ? targets : undefined;
  }

  protected getTargetTypes(): ('pokemon' | 'energy' | 'trainer')[] {
    const types: ('pokemon' | 'energy' | 'trainer')[] = [];
    if (this.text.includes('ポケモン')) types.push('pokemon');
    if (this.text.includes('エネルギー')) types.push('energy');
    if (this.text.includes('トレーナーズ')) types.push('trainer');
    return types;
  }

  protected parsePlayer(): 'self' | 'opponent' {
    return this.text.includes('相手') ? 'opponent' : 'self';
  }

  protected parseLocation(): Location {
    const location: Partial<Location> = {
      type: this.getLocationType(),
    };

    if (this.text.includes('見る')) location.reveal = true;
    if (this.text.includes('切る')) location.shuffle = true;

    return location as Location;
  }

  protected getLocationType(): Location['type'] {
    if (this.text.includes('ベンチ')) return 'bench';
    if (this.text.includes('手札')) return 'hand';
    if (this.text.includes('山札')) return 'deck';
    if (this.text.includes('トラッシュ')) return 'discard';
    if (this.text.includes('サイド')) return 'prize';
    return 'active';
  }

  protected parseCount(
    type: 'card' | 'energy' | 'pokemon' | 'trainer' = 'card'
  ): number {
    const patterns = {
      energy: /エネルギーを(\d+)(個|枚)(まで)?/,
      pokemon: /(\d+)匹(まで)?/,
      trainer: /(\d+)枚(まで)?/,
      card: /(\d+)枚(まで)?/,
    };

    const match = this.text.match(patterns[type]);
    return match ? parseInt(match[1]) : 1;
  }

  protected parseCountWithAll(
    type: 'card' | 'energy' | 'pokemon' | 'trainer' = 'card'
  ): number | 'all' {
    if (this.text.includes('全員') || this.text.includes('すべて')) {
      return 'all';
    }
    return this.parseCount(type);
  }

  protected parseFilters(): Filter[] | undefined {
    const filters: Filter[] = [];
    const cardTypeMap: Record<string, string> = {
      たねポケモン: 'basic',
      '1進化': 'stage1',
      '2進化': 'stage2',
      ポケモンex: 'ポケモンex',
      トレーナーズ: 'トレーナーズ',
      基本エネルギー: 'basic',
    };

    for (const [text, value] of Object.entries(cardTypeMap)) {
      if (this.text.includes(text)) {
        filters.push({ type: 'card-type', value });
      }
    }

    return filters.length > 0 ? filters : undefined;
  }

  protected parseConditions(): Condition[] | undefined {
    const conditions: Condition[] = [];

    // Coin flip conditions
    if (this.text.includes('コインを')) {
      const match = this.text.match(/コインを(\d+)回投げ/);
      if (match) {
        const condition: Condition = {
          type: 'coin-flip',
          value: parseInt(match[1]),
        };

        // Add success/failure effects
        if (this.text.includes('「おもて」なら')) {
          condition.onSuccess = this.parseConditionEffects();
        }
        if (this.text.includes('「うら」なら')) {
          condition.onFailure = this.parseConditionEffects();
        }

        conditions.push(condition);
      }
    }

    return conditions.length > 0 ? conditions : undefined;
  }

  protected parseConditionEffects(): Effect[] | undefined {
    const effects: Effect[] = [];

    if (this.text.includes('ダメージを受けない')) {
      effects.push({
        type: EffectType.Status,
        modifiers: [{ type: 'prevent', what: 'damage' }],
      });
    }

    return effects.length > 0 ? effects : undefined;
  }

  protected parseModifiers(): Modifier[] | undefined {
    const modifiers: Modifier[] = [];

    if (this.text.includes('計算しない')) {
      modifiers.push({ type: 'ignore', what: 'effects' });
    }
    if (this.text.includes('効果を受けない')) {
      modifiers.push({ type: 'immunity', what: 'ability' });
    }
    if (this.text.includes('特性は無効')) {
      modifiers.push({ type: 'nullify', what: 'ability' });
    }

    return modifiers.length > 0 ? modifiers : undefined;
  }

  protected parseDamageValue(): number {
    const match = this.text.match(/(\d+)ダメージ/);
    return match ? parseInt(match[1]) : 0;
  }
}
