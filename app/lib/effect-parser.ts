import * as kuromoji from 'kuromoji';
import { Effect, Timing } from './effects/types';
import { parseEffect } from './effects/parsers';

export interface TokenizedPhrase {
  text: string;
  tokens: kuromoji.IpadicFeatures[];
  timing?: Timing;
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
  if (
    text.includes('1ターンに1回') ||
    text.includes('自分の番に1回使える') ||
    text.match(/自分の番に、.+なら、1回使える/)
  ) {
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
    const timing = parseTiming(text);
    const tokens = tokenizer.tokenize(text);

    return parseEffect({
      text,
      tokens,
      timing,
    });
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
