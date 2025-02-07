import { Effect, EffectType } from '../effect-parser';
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

export function parseAbility(phrase: TokenizedPhrase): AbilityEffect | null {
  const { text } = phrase;

  // Check if this is an ability effect
  if (!text.includes('使える') && !text.includes('特性')) {
    return null;
  }

  // Parse timing
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

  // Parse the actual effect
  const effect: AbilityEffect = {
    type: EffectType.Search,
    target: 'self',
    source: 'deck',
    destination: 'hand',
    count: 1,
    selection: 'choose',
    timing,
    shuffle: text.includes('山札を切る'),
  };

  return effect;
}
