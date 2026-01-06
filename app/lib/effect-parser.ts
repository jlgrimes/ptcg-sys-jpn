import * as kuromoji from 'kuromoji';
import { Effect, Timing } from './effects/types';
import { parseEffect } from './effects/parsers';
import {
  segmentEffectText,
  hasMultipleEffects,
  stripAnnotations,
  extractAnnotations,
  EffectSegment,
} from './effects/parsers/sentence-segmenter';

export interface TokenizedPhrase {
  text: string;
  tokens: kuromoji.IpadicFeatures[];
  timing?: Timing;
}

export interface ParseResult {
  effects: Effect[];
  segments: EffectSegment[];
  annotations: string[];
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
 * Uses sentence segmentation for multi-effect cards
 * @param text The Japanese card effect text to parse
 * @returns An array of parsed Effect objects
 * @throws EffectParseError if tokenization fails
 */
export async function parseEffectText(text: string): Promise<Effect[]> {
  const result = await parseEffectTextFull(text);
  return result.effects;
}

/**
 * Full parsing with additional metadata
 */
export async function parseEffectTextFull(text: string): Promise<ParseResult> {
  if (!text?.trim()) {
    return { effects: [], segments: [], annotations: [] };
  }

  try {
    const tokenizer = await getTokenizer();
    const timing = parseTiming(text);
    const annotations = extractAnnotations(text);

    // Segment the text for multi-effect handling
    const segmentation = segmentEffectText(text);
    const allEffects: Effect[] = [];

    // Parse each non-annotation segment
    const effectSegments = segmentation.segments.filter(s => !s.isAnnotation);

    if (effectSegments.length <= 1) {
      // Single effect - use original parsing
      const cleanText = stripAnnotations(text);
      const tokens = tokenizer.tokenize(cleanText);
      const effects = parseEffect({ text: cleanText, tokens, timing });
      return {
        effects,
        segments: segmentation.segments,
        annotations,
        timing,
      };
    }

    // Multiple effects - parse each segment
    for (const segment of effectSegments) {
      const tokens = tokenizer.tokenize(segment.text);
      const segmentEffects = parseEffect({
        text: segment.text,
        tokens,
        timing: segment.relationship === 'independent' ? timing : undefined,
      });
      allEffects.push(...segmentEffects);
    }

    return {
      effects: allEffects,
      segments: segmentation.segments,
      annotations,
      timing,
    };
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
