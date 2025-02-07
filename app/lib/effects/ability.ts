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

export function parseAbility(phrase: TokenizedPhrase): Effect | null {
  const { text } = phrase;

  // Check if this is an ability effect
  if (
    !text.includes('使える') &&
    !text.includes('特性') &&
    !text.includes('効果を受けない') &&
    !text.includes('バトルポケモンのとき')
  ) {
    return null;
  }

  // Check for damage prevention with coin flip
  if (text.includes('バトルポケモンのとき') && text.includes('コインを')) {
    return {
      type: EffectType.Ability,
      timing: {
        type: 'continuous',
        condition: 'active',
      },
      effect: {
        type: 'damage-prevention',
        coinFlips: 1,
        target: 'opponent',
        what: 'damage',
        onHeads: true,
      },
    };
  }

  // Check for ability immunity
  if (text.includes('特性の効果を受けない')) {
    return {
      type: EffectType.Ability,
      effect: {
        type: 'immunity',
        what: 'ability',
        target: text.includes('相手の') ? 'opponent' : 'self',
      },
    };
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
