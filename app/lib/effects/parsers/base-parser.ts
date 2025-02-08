import { TokenizedPhrase } from '../../effect-parser';
import {
  Effect,
  Target,
  Location,
  Filter,
  Condition,
  Modifier,
} from '../types';
import * as kuromoji from 'kuromoji';

export abstract class BaseParser<T extends Effect = Effect> {
  protected text: string;
  protected tokens: TokenizedPhrase['tokens'];

  constructor(phrase: TokenizedPhrase) {
    this.text = phrase.text;
    this.tokens = phrase.tokens;
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

  protected parseTargets(): Target[] | undefined {
    const targets: Target[] = [];

    if (this.text.includes('ポケモン')) {
      const target: Partial<Target> = {
        type: 'pokemon',
        player: this.text.includes('相手') ? 'opponent' : 'self',
        location: this.parseLocation(),
      };

      const count = this.parseCountWithAll();
      if (count) target.count = count;

      const filters = this.parseFilters();
      if (filters) target.filters = filters;

      targets.push(target as Target);
    }

    return targets.length > 0 ? targets : undefined;
  }

  protected parseLocation(): Location {
    const location: Partial<Location> = {
      type: this.text.includes('ベンチ')
        ? 'bench'
        : this.text.includes('手札')
        ? 'hand'
        : this.text.includes('山札')
        ? 'deck'
        : this.text.includes('トラッシュ')
        ? 'discard'
        : 'active',
    };

    if (this.text.includes('見る')) location.reveal = true;
    if (this.text.includes('切る')) location.shuffle = true;

    return location as Location;
  }

  protected parseCount(type: 'card' | 'energy' | 'pokemon' = 'card'): number {
    if (type === 'energy') {
      const energyMatch = this.text.match(/エネルギーを(\d+)個/);
      if (energyMatch) {
        return parseInt(energyMatch[1]);
      }
    }

    if (type === 'pokemon') {
      const pokemonMatch = this.text.match(/(\d+)匹/);
      if (pokemonMatch) {
        return parseInt(pokemonMatch[1]);
      }
    }

    const cardMatch = this.text.match(/(\d+)枚/);
    return cardMatch ? parseInt(cardMatch[1]) : 1;
  }

  protected parseCountWithAll(
    type: 'card' | 'energy' | 'pokemon' = 'card'
  ): number | 'all' {
    if (this.text.includes('全員') || this.text.includes('すべて')) {
      return 'all';
    }
    return this.parseCount(type);
  }

  protected parseFilters(): Filter[] | undefined {
    const filters: Filter[] = [];

    if (this.text.includes('たねポケモン')) {
      filters.push({ type: 'card-type', value: 'basic' });
    }

    return filters.length > 0 ? filters : undefined;
  }

  protected parseConditions(): Condition[] | undefined {
    const conditions: Condition[] = [];

    if (this.text.includes('コインを')) {
      const match = this.text.match(/コインを(\d+)回投げ/);
      if (match) {
        conditions.push({
          type: 'coin-flip',
          value: parseInt(match[1]),
        });
      }
    }

    return conditions.length > 0 ? conditions : undefined;
  }

  protected parseModifiers(): Modifier[] | undefined {
    const modifiers: Modifier[] = [];

    if (this.text.includes('計算しない')) {
      modifiers.push({
        type: 'ignore',
        what: 'effects',
      });
    }

    return modifiers.length > 0 ? modifiers : undefined;
  }
}
