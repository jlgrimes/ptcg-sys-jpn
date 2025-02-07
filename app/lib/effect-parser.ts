import * as kuromoji from 'kuromoji';
import { parseMoveRestriction } from './effects/move-restriction';
import { parseBenchDamage } from './effects/bench-damage';
import { parseEnergyManipulation } from './effects/energy-manipulation';
import { parseCountDamage } from './effects/count-damage';
import { parseDamageModifier } from './effects/damage-modifier';
import { parseConditionCheck } from './effects/condition-check';
import { parseAbility } from './effects/ability';

// Types for different effect components
export enum EffectType {
  Damage = 'damage',
  Draw = 'draw',
  Search = 'search',
  Discard = 'discard',
  Condition = 'condition',
  Counter = 'counter',
  Status = 'status',
  Switch = 'switch',
  Energy = 'energy',
  Heal = 'heal',
  Restriction = 'restriction',
}

export interface Effect {
  type: EffectType;
  value?: number;
  target?: 'self' | 'opponent' | 'both';
  condition?: string;
  location?: 'deck' | 'hand' | 'discard' | 'bench' | 'active';
  count?: number | 'all';
  ignoreWeaknessResistance?: boolean; // For bench damage effects
  multiplier?: {
    type: 'count';
    target: 'self' | 'opponent';
    condition: string;
    location: 'field' | 'bench' | 'discard';
  };
  modifier?: {
    type: 'ignore' | 'double' | 'half';
    what: 'effects' | 'weakness' | 'resistance';
    target: 'self' | 'opponent';
    location: 'active' | 'bench';
  };
  check?: {
    type: 'prize-count';
    target: 'self' | 'opponent';
    values: number[];
    comparison: 'equal' | 'not-equal' | 'greater' | 'less';
  };
  result?: 'fail' | 'success';
  timing?: {
    type: 'once-per-turn' | 'on-evolution' | 'on-play' | 'continuous';
    restriction?: {
      type: 'ability-not-used' | 'pokemon-condition' | 'field-condition';
      abilityName?: string;
      condition?: string;
    };
  };
  shuffle?: boolean;
  source?: 'deck' | 'hand' | 'discard' | 'bench' | 'active';
  destination?: 'deck' | 'hand' | 'discard' | 'bench' | 'active';
  selection?: 'choose' | 'random' | 'all';
}

interface TokenizedPhrase {
  text: string;
  tokens: kuromoji.IpadicFeatures[];
}

export async function parseEffectText(text: string): Promise<Effect[]> {
  const tokenizer = await getTokenizer();
  const effects: Effect[] = [];

  // Process the entire text as one unit if it contains brackets
  const phrases: TokenizedPhrase[] = [
    {
      text: text,
      tokens: tokenizer.tokenize(text),
    },
  ];

  // Process each phrase
  for (const phrase of phrases) {
    const effect = parsePhrase(phrase);
    if (effect) {
      effects.push(effect);
    }
  }

  return effects;
}

function parsePhrase(phrase: TokenizedPhrase): Effect | null {
  // Try ability first
  const ability = parseAbility(phrase);
  if (ability) {
    return ability;
  }

  // Try condition check first
  const conditionCheck = parseConditionCheck(phrase);
  if (conditionCheck) {
    return conditionCheck;
  }

  // Try damage modifier first
  const damageModifier = parseDamageModifier(phrase);
  if (damageModifier) {
    return damageModifier;
  }

  // Try count damage first
  const countDamage = parseCountDamage(phrase);
  if (countDamage) {
    return countDamage;
  }

  // Try energy manipulation first
  const energyEffect = parseEnergyManipulation(phrase);
  if (energyEffect) {
    return energyEffect;
  }

  // Try bench damage
  const benchDamage = parseBenchDamage(phrase);
  if (benchDamage) {
    return benchDamage;
  }

  // Try move restriction
  const moveRestriction = parseMoveRestriction(phrase);
  if (moveRestriction) {
    return moveRestriction;
  }

  const { text, tokens } = phrase;

  // Find action indicators in the tokens
  const hasDrawAction = tokens.some(t => t.basic_form === '引く');
  const hasDiscardAction = tokens.some(t => t.basic_form === 'トラッシュ');
  const hasDamageAction = tokens.some(t => t.surface_form.includes('ダメージ'));

  // Parse draw effects
  if (hasDrawAction) {
    const numberToken = tokens.find(
      t => t.pos === '名詞' && !isNaN(parseInt(t.surface_form))
    );
    if (numberToken) {
      return {
        type: EffectType.Draw,
        value: parseInt(numberToken.surface_form),
        target: text.includes('自分') ? 'self' : 'opponent',
        location: 'deck',
      };
    }
  }

  // Parse discard effects
  if (hasDiscardAction) {
    const numberToken = tokens.find(
      t => t.pos === '名詞' && !isNaN(parseInt(t.surface_form))
    );
    if (numberToken) {
      return {
        type: EffectType.Discard,
        value: parseInt(numberToken.surface_form),
        target: text.includes('自分') ? 'self' : 'opponent',
        location: text.includes('手札') ? 'hand' : 'discard',
      };
    }
  }

  // Parse damage effects
  if (hasDamageAction) {
    // Look specifically for the damage number before 'ダメージ'
    const damageMatch = text.match(/(\d+)ダメージ/);
    if (damageMatch) {
      const effect: Effect = {
        type: EffectType.Damage,
        value: parseInt(damageMatch[1]),
        target: text.includes('自分') ? 'self' : 'opponent',
        ignoreWeaknessResistance: false,
      };

      // Determine damage location and count
      if (text.includes('ベンチポケモン')) {
        effect.location = 'bench';
        const countMatch = text.match(/(\d+)匹/);
        if (countMatch) {
          effect.count = parseInt(countMatch[1]);
        }

        // Look for bracketed text and check for weakness/resistance rule
        const bracketMatch = text.match(/［([^］]+)］/);
        if (bracketMatch) {
          const bracketContent = bracketMatch[1];
          if (bracketContent.includes('弱点・抵抗力を計算しない')) {
            effect.ignoreWeaknessResistance = true;
          }
        }
      } else {
        effect.location = 'active';
      }

      return effect;
    }
  }

  return null;
}

// Tokenizer initialization
let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

async function getTokenizer(): Promise<
  kuromoji.Tokenizer<kuromoji.IpadicFeatures>
> {
  if (tokenizer) return tokenizer;

  return new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: 'node_modules/kuromoji/dict' })
      .build((err, _tokenizer) => {
        if (err) reject(err);
        tokenizer = _tokenizer;
        resolve(tokenizer);
      });
  });
}

// Example usage:
// const effects = await parseEffectText("自分の山札を2枚引く。相手の手札を1枚トラッシュする。");
// Returns:
// [
//   {
//     type: EffectType.Draw,
//     value: 2,
//     target: 'self',
//     location: 'deck'
//   },
//   {
//     type: EffectType.Discard,
//     value: 1,
//     target: 'opponent',
//     location: 'hand'
//   }
// ]

// Also export the TokenizedPhrase type for use in effect handlers
export type { TokenizedPhrase };
