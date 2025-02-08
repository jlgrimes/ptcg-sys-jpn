import { TokenizedPhrase } from '../../effect-parser';
import { Effect } from '../types';
import { DamageParser } from './damage-parser';
import { StatusParser } from './status-parser';
import { DrawParser } from './draw-parser';
import { SearchParser } from './search-parser';
import { DiscardParser } from './discard-parser';
import { AbilityParser } from './ability-parser';
import { EnergyParser } from './energy-parser';
import { PlaceParser } from './place-parser';
import { MoveRestrictionParser } from './move-restriction-parser';
import { ConditionParser } from './condition-parser';

const parsers = [
  DamageParser,
  StatusParser,
  DrawParser,
  SearchParser,
  DiscardParser,
  AbilityParser,
  EnergyParser,
  PlaceParser,
  MoveRestrictionParser,
  ConditionParser,
];

export function parseEffect(phrase: TokenizedPhrase): Effect | Effect[] | null {
  for (const Parser of parsers) {
    const parser = new Parser(phrase);
    if (parser.canParse()) {
      return parser.parse();
    }
  }
  return null;
}

export {
  DamageParser,
  StatusParser,
  DrawParser,
  SearchParser,
  DiscardParser,
  AbilityParser,
  EnergyParser,
  PlaceParser,
  MoveRestrictionParser,
  ConditionParser,
};
