import { parseEffectText } from '../effect-parser';
import { Effect } from '../effects/types';
import {
  CardCorpusEntry,
  CoverageResult,
  CoverageReport,
  PatternFrequency,
  SetCoverage,
} from './types';

export interface TrackOptions {
  onProgress?: (current: number, total: number, result: CoverageResult) => void;
}

export class CoverageTracker {
  private results: CoverageResult[] = [];

  /**
   * Track parsing coverage for a single effect text
   */
  async trackEffect(
    cardId: string,
    cardName: string,
    effectSource: 'ability' | 'move' | 'card-effect',
    effectText: string,
    effectName?: string
  ): Promise<CoverageResult> {
    const startTime = performance.now();

    let parsedEffects: Effect[] = [];
    let parserUsed: string | null = null;

    try {
      parsedEffects = await parseEffectText(effectText);
      // Note: We'd need to modify parseEffectText to return parser info
      // For now, we'll infer success from non-empty results
    } catch (error) {
      // Parse failed with error
    }

    const parseTimeMs = performance.now() - startTime;
    const parseSuccess = parsedEffects.length > 0;

    const result: CoverageResult = {
      cardId,
      cardName,
      effectSource,
      effectName,
      effectText,
      parsedEffects,
      parseSuccess,
      parserUsed,
      parseTimeMs,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Track parsing coverage for all effects in a card
   */
  async trackCard(card: CardCorpusEntry): Promise<CoverageResult[]> {
    const cardResults: CoverageResult[] = [];

    for (const effect of card.effects) {
      const result = await this.trackEffect(
        card.id,
        card.name,
        effect.source,
        effect.text,
        effect.name
      );
      cardResults.push(result);
    }

    return cardResults;
  }

  /**
   * Track parsing coverage for multiple cards
   */
  async trackCards(cards: CardCorpusEntry[], options: TrackOptions = {}): Promise<void> {
    const { onProgress } = options;

    let totalEffects = 0;
    for (const card of cards) {
      totalEffects += card.effects.length;
    }

    let current = 0;
    for (const card of cards) {
      const cardResults = await this.trackCard(card);
      for (const result of cardResults) {
        current++;
        if (onProgress) {
          onProgress(current, totalEffects, result);
        }
      }
    }
  }

  /**
   * Get all tracking results
   */
  getResults(): CoverageResult[] {
    return this.results;
  }

  /**
   * Clear all tracking results
   */
  clear(): void {
    this.results = [];
  }

  /**
   * Get only failed results
   */
  getFailedResults(): CoverageResult[] {
    return this.results.filter(r => !r.parseSuccess);
  }

  /**
   * Generate a coverage report
   */
  generateReport(): CoverageReport {
    const totalEffects = this.results.length;
    const parsedSuccessfully = this.results.filter(r => r.parseSuccess).length;
    const failedToParse = totalEffects - parsedSuccessfully;

    // Unique cards
    const uniqueCards = new Set(this.results.map(r => r.cardId));

    // Coverage by set (would need set info in results)
    const bySet: Record<string, SetCoverage> = {};

    // Parser usage
    const parserUsage: Record<string, number> = {};
    for (const result of this.results) {
      if (result.parserUsed) {
        parserUsage[result.parserUsed] = (parserUsage[result.parserUsed] || 0) + 1;
      }
    }

    // Analyze unparsed patterns
    const unparsedPatterns = this.analyzeUnparsedPatterns();

    return {
      generatedAt: new Date().toISOString(),
      totalCards: uniqueCards.size,
      totalEffects,
      parsedSuccessfully,
      failedToParse,
      coveragePercentage: totalEffects > 0 ? (parsedSuccessfully / totalEffects) * 100 : 0,
      bySet,
      unparsedPatterns,
      parserUsage,
    };
  }

  /**
   * Analyze unparsed effect texts to find common patterns
   */
  private analyzeUnparsedPatterns(): PatternFrequency[] {
    const failed = this.getFailedResults();
    const patternCounts = new Map<string, { count: number; examples: string[] }>();

    // Extract common Japanese phrases/patterns from failed parses
    const patterns = [
      // Healing
      /回復/,
      /ダメカン.*取る/,
      /HP.*回復/,
      // Prevention
      /受けない/,
      /防ぐ/,
      /ダメージを.*する/,
      // Deck manipulation
      /山札を.*見る/,
      /好きな順番/,
      /山札の上/,
      /山札の下/,
      // Hand manipulation
      /手札.*見る/,
      /手札.*もどす/,
      /シャッフル/,
      // Trainer blocking
      /グッズ.*使えない/,
      /サポート.*使えない/,
      /トレーナーズ.*使えない/,
      // Special conditions
      /やけど/,
      /どく/,
      // Energy manipulation
      /エネルギー.*つけ/,
      /エネルギー.*もどす/,
      // Evolution
      /進化.*できる/,
      /進化.*のせる/,
      // Prize
      /サイド/,
      // Choice
      /選び/,
      /選ぶ/,
      // GX/VSTAR specific
      /GXワザ/,
      /VSTARパワー/,
      // Retreat
      /にげる/,
    ];

    for (const result of failed) {
      for (const pattern of patterns) {
        if (pattern.test(result.effectText)) {
          const patternStr = pattern.source;
          const existing = patternCounts.get(patternStr);
          if (existing) {
            existing.count++;
            if (existing.examples.length < 3) {
              existing.examples.push(result.effectText);
            }
          } else {
            patternCounts.set(patternStr, {
              count: 1,
              examples: [result.effectText],
            });
          }
        }
      }
    }

    // Convert to sorted array
    const sortedPatterns: PatternFrequency[] = Array.from(patternCounts.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        examples: data.examples,
      }))
      .sort((a, b) => b.count - a.count);

    return sortedPatterns;
  }
}

/**
 * Quick utility to check coverage for a single effect text
 */
export async function checkEffectCoverage(effectText: string): Promise<{
  success: boolean;
  effects: Effect[];
}> {
  try {
    const effects = await parseEffectText(effectText);
    return {
      success: effects.length > 0,
      effects,
    };
  } catch {
    return {
      success: false,
      effects: [],
    };
  }
}
