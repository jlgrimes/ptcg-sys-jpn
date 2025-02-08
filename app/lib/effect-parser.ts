import * as kuromoji from 'kuromoji';
import { Effect, EffectType, Timing } from './effects/types';
import { parseEffect } from './effects/parsers';

export interface TokenizedPhrase {
  text: string;
  tokens: kuromoji.IpadicFeatures[];
}

export class EffectParseError extends Error {
  constructor(message: string, public readonly originalText: string) {
    super(message);
    this.name = 'EffectParseError';
  }
}

function parseTiming(text: string): Timing | undefined {
  if (text.includes('バトルポケモンのとき')) {
    return {
      type: 'continuous',
      condition: 'active',
    };
  }
  if (text.includes('進化させたとき')) {
    return {
      type: 'on-evolution',
    };
  }
  if (text.includes('1ターンに1回') || text.includes('自分の番に1回使える')) {
    return {
      type: 'once-per-turn',
    };
  }
  return undefined;
}

/**
 * Parses Japanese card effect text into structured Effect objects
 * @param text The Japanese card effect text to parse
 * @returns An array of parsed Effect objects
 * @throws EffectParseError if tokenization fails
 */
export async function parseEffectText(text: string): Promise<Effect[]> {
  if (!text?.trim()) {
    return [];
  }

  try {
    const tokenizer = await getTokenizer();
    const effects: Effect[] = [];

    // Check if this is an ability
    const isAbility = text.includes('特性「');
    const timing = parseTiming(text);

    // Parse the effects
    const effectText = isAbility
      ? text.replace(/特性「.+?」：?/, '').trim()
      : text;
    const parsedEffects = parseEffect({
      text: effectText,
      tokens: tokenizer.tokenize(effectText),
    });

    // If this is an ability, add the ability effect first
    if (isAbility) {
      effects.push({
        type: EffectType.Ability,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'active',
            },
          },
        ],
        timing,
        ...(text.includes('効果を受けない') && {
          modifiers: [{ type: 'immunity', what: 'ability' }],
        }),
        ...(text.includes('特性は無効') && {
          modifiers: [{ type: 'nullify', what: 'ability' }],
        }),
      });
    }

    // Add the parsed effects
    effects.push(...parsedEffects);

    return effects;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new EffectParseError(`Failed to parse effect text: ${message}`, text);
  }
}

let tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

/**
 * Gets or initializes the kuromoji tokenizer
 * @returns A Promise that resolves to the tokenizer instance
 * @throws Error if tokenizer initialization fails
 */
async function getTokenizer(): Promise<
  kuromoji.Tokenizer<kuromoji.IpadicFeatures>
> {
  if (tokenizer) return tokenizer;

  return new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: 'node_modules/kuromoji/dict' })
      .build((err, _tokenizer) => {
        if (err) {
          reject(new Error(`Failed to initialize tokenizer: ${err.message}`));
          return;
        }
        tokenizer = _tokenizer;
        resolve(tokenizer);
      });
  });
}

// Re-export types
export type { Effect };
