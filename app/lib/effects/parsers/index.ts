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
  new (phrase: TokenizedPhrase): BaseParser;
}

class ParserRegistry {
  private parsers: Array<(phrase: TokenizedPhrase) => BaseParser> = [];
  private logger = Logger.getInstance();

  register(ParserClass: ParserConstructor): void {
    this.parsers.push(phrase => new ParserClass(phrase));
    this.logger.debug(`Registered parser: ${ParserClass.name}`);
  }

  parseEffect(phrase: TokenizedPhrase): Effect[] {
    const effects: Effect[] = [];
    const parsedEffects = new Set<string>();

    for (const createParser of this.parsers) {
      try {
        const parser = createParser(phrase);
        if (parser.canParse()) {
          this.logger.debug(`Parsing with ${parser.constructor.name}`, {
            text: phrase.text,
          });

          const effect = parser.parse();
          if (effect) {
            const effectsToAdd = Array.isArray(effect) ? effect : [effect];
            for (const e of effectsToAdd) {
              // Create a key that uniquely identifies this effect
              const key = this.createEffectKey(e);
              if (!parsedEffects.has(key)) {
                effects.push(e);
                parsedEffects.add(key);
                this.logger.debug(
                  `Parser ${parser.constructor.name} added effect`,
                  { key }
                );
              } else {
                this.logger.debug(
                  `Parser ${parser.constructor.name} skipped duplicate effect`,
                  { key }
                );
              }
            }
          } else {
            this.logger.debug(
              `Parser ${parser.constructor.name} returned no effects`
            );
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

    return effects;
  }

  private createEffectKey(effect: Effect): string {
    // Create a unique key based on the effect's properties
    const parts: string[] = [effect.type];

    if (effect.value !== undefined) {
      parts.push(`value:${effect.value}`);
    }

    if (effect.targets) {
      for (const target of effect.targets) {
        parts.push(
          `target:${target.type}:${target.player}:${target.location.type}`
        );
      }
    }

    if (effect.modifiers) {
      for (const modifier of effect.modifiers) {
        parts.push(`modifier:${modifier.type}:${modifier.what}`);
      }
    }

    return parts.join('|');
  }
}

const registry = new ParserRegistry();

// Register all parsers
registry.register(AbilityParser);
registry.register(BenchDamageParser);
registry.register(CountDamageParser);
registry.register(DamageModifierParser);
registry.register(DamageParser);
registry.register(DiscardParser);
registry.register(DrawParser);
registry.register(EnergyParser);
registry.register(PlaceParser);
registry.register(SearchParser);
registry.register(StatusParser);
registry.register(ConditionParser);
registry.register(MoveRestrictionParser);

export function parseEffect(phrase: TokenizedPhrase): Effect[] {
  return registry.parseEffect(phrase);
}
