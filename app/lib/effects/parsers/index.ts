import { TokenizedPhrase } from '../../effect-parser';
import { Effect } from '../types';
import { BaseParser } from './base-parser';
import { BenchDamageParser } from './bench-damage-parser';
import { CountDamageParser } from './count-damage-parser';
import { DamageModifierParser } from './damage-modifier-parser';
import { DamageParser } from './damage-parser';
import { DiscardParser } from './discard-parser';
import { DrawParser } from './draw-parser';
import { EnergyParser } from './energy-parser';
import { PlaceParser } from './place-parser';
import { SearchParser } from './search-parser';
import { StatusParser } from './status-parser';
import { ConditionParser } from './condition-parser';
import { MoveRestrictionParser } from './move-restriction-parser';
import { BenchPlacementParser } from './bench-placement-parser';
import { SwitchParser } from './switch-parser';
import { HandToDeckParser } from './hand-to-deck-parser';
import { Logger } from '../../utils/logger';
import { BaseEffectParser } from './utils/base-effect-parser';
import { BaseEffect } from '../types';

export type ParserConstructor = new (phrase: TokenizedPhrase) =>
  | BaseParser<BaseEffect>
  | BaseEffectParser<BaseEffect>;

class ParserRegistry {
  private logger = Logger.getInstance();
  private parsers: Array<{
    parser: ParserConstructor;
    priority: number;
  }> = [];

  register(parser: ParserConstructor, priority: number): void {
    this.parsers.push({ parser, priority });
    this.parsers.sort((a, b) => b.priority - a.priority);
    this.logger.debug(`Registered parser with priority ${priority}`, {
      parser: parser.name,
    });
  }

  parse(phrase: TokenizedPhrase): BaseEffect[] {
    // Sort parsers by priority (higher priority first)
    const sortedParsers = [...this.parsers].sort(
      (a, b) => b.priority - a.priority
    );

    // Try each parser in order until one succeeds
    for (const { parser } of sortedParsers) {
      try {
        const instance = new parser(phrase);
        if (instance.canParse()) {
          const result = instance.parse();
          if (result) {
            // Return the first successful parse result
            return Array.isArray(result) ? result : [result];
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          'Parser error',
          { text: phrase.text, parser: parser.name },
          err
        );
        throw err;
      }
    }

    // If no parser matched, return empty array
    return [];
  }
}

export const registry = new ParserRegistry();

// Register parsers in priority order (higher number = higher priority)
registry.register(CountDamageParser, 800);
registry.register(BenchDamageParser, 700);
registry.register(DamageModifierParser, 600);
registry.register(StatusParser, 500);
registry.register(HandToDeckParser, 450);
registry.register(EnergyParser, 400);
registry.register(BenchPlacementParser, 300); // Add before generic place/search
registry.register(SwitchParser, 250); // Add between bench placement and place
registry.register(PlaceParser, 200);
registry.register(SearchParser, 100);
registry.register(DiscardParser, 50);
registry.register(DrawParser, 40);
registry.register(ConditionParser, 30);
registry.register(DamageParser, 10); // Most generic damage parser last
registry.register(MoveRestrictionParser, 5); // Move restriction should be last

export function parseEffect(phrase: TokenizedPhrase): Effect[] {
  return registry.parse(phrase);
}
