import * as kuromoji from 'kuromoji';
import { Effect } from './effects/types';
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

    // Extract ability name if present
    const abilityNameMatch = text.match(/特性「(.+?)」/);
    const abilityName = abilityNameMatch ? abilityNameMatch[1] : '';

    // Remove ability name from text for parsing
    const effectText = text.replace(/特性「.+?」：?/, '').trim();

    const phrases: TokenizedPhrase[] = [
      {
        text: effectText,
        tokens: tokenizer.tokenize(effectText),
      },
    ];

    for (const phrase of phrases) {
      const parsedEffects = parseEffect(phrase);
      // Add ability name to timing restrictions if present
      const processedEffects = parsedEffects.map(e => {
        if (e.timing?.restriction?.type === 'ability-not-used' && abilityName) {
          e.timing.restriction.abilityName = abilityName;
        }
        return e;
      });
      effects.push(...processedEffects);
    }

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
