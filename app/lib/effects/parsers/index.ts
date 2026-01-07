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
import { MoveConditionParser } from './move-condition-parser';
import { Logger } from '../../utils/logger';
import { BaseEffectParser } from './utils/base-effect-parser';
import { BaseEffect } from '../types';
import { CopyParser } from './copy-parser';
// New parsers (Phase 3)
import { HealParser } from './heal-parser';
import { PreventionParser } from './prevention-parser';
import { DeckManipulationParser } from './deck-manipulation-parser';
import { TrainerBlockParser } from './trainer-block-parser';
// Additional parsers (Phase 3b)
import { PrizeParser } from './prize-parser';
import { RetreatModifierParser } from './retreat-modifier-parser';
import { DamageBonusParser } from './damage-bonus-parser';
import { SpecialPlayParser } from './special-play-parser';
import { DevolutionParser } from './devolution-parser';
import { CounterParser } from './counter-parser';

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
registry.register(MoveConditionParser, 900); // Highest priority for conditional moves
registry.register(CountDamageParser, 800);
registry.register(BenchDamageParser, 700);
registry.register(CopyParser, 650); // High priority since it's a specific move-related action
registry.register(DamageModifierParser, 600);
registry.register(PreventionParser, 550); // Prevention before status (both can have 受けない)
registry.register(StatusParser, 500);
registry.register(TrainerBlockParser, 480); // Trainer blocking effects
registry.register(HealParser, 460); // Healing effects
registry.register(CounterParser, 455); // Damage counter placement
registry.register(HandToDeckParser, 450);
registry.register(DeckManipulationParser, 420); // Deck manipulation before energy
registry.register(EnergyParser, 400);
registry.register(SpecialPlayParser, 320); // Special play/evolution conditions - before generic place
registry.register(BenchPlacementParser, 300); // Add before generic place/search
registry.register(SwitchParser, 250); // Add between bench placement and place
registry.register(PlaceParser, 200);
registry.register(SearchParser, 100);
registry.register(DiscardParser, 50);
registry.register(DrawParser, 40);
registry.register(ConditionParser, 30);
registry.register(PrizeParser, 25); // Prize manipulation
registry.register(RetreatModifierParser, 20); // Retreat cost modification
registry.register(DamageBonusParser, 15); // Damage bonuses like +30
registry.register(DevolutionParser, 11); // Devolution effects
registry.register(DamageParser, 10); // Most generic damage parser last
registry.register(MoveRestrictionParser, 5); // Move restriction should be last

export function parseEffect(phrase: TokenizedPhrase): Effect[] {
  return registry.parse(phrase);
}
