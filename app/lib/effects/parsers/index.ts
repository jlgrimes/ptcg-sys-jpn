import { TokenizedPhrase } from '../../effect-parser';
import { Effect } from '../types';
import { BaseParser } from './base-parser';
import { AbilityParser } from './ability-parser';
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
import { ParserError } from './parser-error';
import { Logger } from '../../utils/logger';

interface ParserConstructor {
  new (phrase: TokenizedPhrase): BaseParser<Effect>;
}

class ParserRegistry {
  private parsers: Array<{
    parser: (phrase: TokenizedPhrase) => BaseParser<Effect>;
    priority: number;
  }> = [];
  private logger = Logger.getInstance();

  register(ParserClass: ParserConstructor, priority: number): void {
    this.parsers.push({
      parser: phrase => new ParserClass(phrase),
      priority,
    });
    this.logger.debug(
      `Registered parser: ${ParserClass.name} with priority ${priority}`
    );
  }

  parseEffect(phrase: TokenizedPhrase): Effect[] {
    // Sort parsers by priority (higher priority first)
    const sortedParsers = [...this.parsers].sort(
      (a, b) => b.priority - a.priority
    );

    for (const { parser } of sortedParsers) {
      try {
        const instance = parser(phrase);
        if (instance.canParse()) {
          this.logger.debug(`Parsing with ${instance.constructor.name}`, {
            text: phrase.text,
          });

          const effect = instance.parse();
          if (effect) {
            const effects = Array.isArray(effect) ? effect : [effect];
            this.logger.debug(
              `Parser ${instance.constructor.name} added effects`,
              { count: effects.length }
            );
            return effects;
          }
        }
      } catch (error) {
        if (error instanceof ParserError) {
          this.logger.warn(
            `Parser error`,
            {
              parser: error.parserName,
              text: error.phrase.text,
            },
            error
          );
        } else {
          this.logger.error(
            `Unexpected error in parser`,
            {
              text: phrase.text,
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    }

    return [];
  }
}

const registry = new ParserRegistry();

// Register parsers in priority order (most specific first)
registry.register(AbilityParser, 1000); // Abilities are most specific
registry.register(MoveRestrictionParser, 900);
registry.register(CountDamageParser, 800);
registry.register(BenchDamageParser, 700);
registry.register(DamageModifierParser, 600);
registry.register(StatusParser, 500);
registry.register(EnergyParser, 400);
registry.register(PlaceParser, 200);
registry.register(SearchParser, 100);
registry.register(DiscardParser, 50);
registry.register(DrawParser, 40);
registry.register(ConditionParser, 30);
registry.register(DamageParser, 10); // Most generic damage parser last

export function parseEffect(phrase: TokenizedPhrase): Effect[] {
  return registry.parseEffect(phrase);
}
