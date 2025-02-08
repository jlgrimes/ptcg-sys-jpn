import { Effect, EffectType } from './types';
import type { TokenizedPhrase } from '../effect-parser';

interface AbilityTiming {
  type: 'once-per-turn' | 'on-evolution' | 'on-play' | 'continuous';
  restriction?: {
    type: 'ability-not-used' | 'pokemon-condition' | 'field-condition';
    abilityName?: string;
    condition?: string;
  };
}

export interface AbilityEffect extends Effect {
  timing: AbilityTiming;
}

export function parseAbility(phrase: TokenizedPhrase): Effect | null {
  const { text } = phrase;

  if (
    !text.includes('使える') &&
    !text.includes('特性') &&
    !text.includes('効果を受けない') &&
    !text.includes('バトルポケモンのとき')
  ) {
    return null;
  }

  const effect: Partial<Effect> = {
    type: EffectType.Ability,
  };

  if (text.includes('特性の効果を受けない')) {
    effect.effect = {
      type: 'immunity',
      what: 'ability',
      target: text.includes('相手の') ? 'opponent' : 'self',
    };
    return effect as Effect;
  }

  // Check for damage prevention with coin flip
  if (text.includes('バトルポケモンのとき') && text.includes('コインを')) {
    effect.timing = {
      type: 'continuous',
      condition: 'active',
    };
    effect.effect = {
      type: 'damage-prevention',
      coinFlips: 1,
      target: 'opponent',
      what: 'damage',
      onHeads: true,
    };
    return effect as Effect;
  }

  // Check for ability nullification
  if (text.includes('特性は無効')) {
    effect.timing = {
      type: 'continuous',
      condition: 'active',
    };
    effect.effect = {
      type: 'nullify',
      what: 'ability',
      target: 'opponent',
      location: 'active',
    };
    return effect as Effect;
  }

  // Parse timing for search abilities
  const timing: AbilityTiming = {
    type: text.includes('1回使える') ? 'once-per-turn' : 'continuous',
  };

  // Parse ability name restriction
  const abilityNameMatch = text.match(/「([^」]+)」/);
  if (abilityNameMatch && text.includes('使っていたなら')) {
    timing.restriction = {
      type: 'ability-not-used',
      abilityName: abilityNameMatch[1],
    };
  }

  // Return search effect for search abilities
  if (text.includes('山札から') && text.includes('手札に加える')) {
    effect.timing = timing;
    effect.type = EffectType.Search;
    effect.target = 'self';
    effect.source = 'deck';
    effect.destination = 'hand';
    effect.count = 1;
    effect.selection = 'choose';
    effect.shuffle = text.includes('山札を切る');
    return effect as Effect;
  }

  return null;
}
