import * as kuromoji from 'kuromoji';
import { Effect } from './effects/types';
import { parseEffect } from './effects/parsers';

export interface TokenizedPhrase {
  text: string;
  tokens: kuromoji.IpadicFeatures[];
}

export async function parseEffectText(text: string): Promise<Effect[]> {
  const tokenizer = await getTokenizer();
  const effects: Effect[] = [];

  const phrases: TokenizedPhrase[] = [
    {
      text: text,
      tokens: tokenizer.tokenize(text),
    },
  ];

  for (const phrase of phrases) {
    const effect = parseEffect(phrase);
    if (effect) {
      if (Array.isArray(effect)) {
        effects.push(...effect);
      } else {
        effects.push(effect);
      }
    }
  }

  return effects;
}

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

// Re-export types
export type { Effect };
