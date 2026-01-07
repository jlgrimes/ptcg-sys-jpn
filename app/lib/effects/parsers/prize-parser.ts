import { BaseParser } from './base-parser';
import { Effect, EffectType, PrizeEffect, Target } from '../types';

/**
 * Parses prize-related effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - サイドは1枚少なくなる: "Prizes taken is reduced by 1"
 * - サイドを1枚多くとる: "Take 1 extra prize"
 * - サイドを見る: "Look at prizes"
 * - サイドを入れかえる: "Swap prizes"
 */
export class PrizeParser extends BaseParser<PrizeEffect> {
  canParse(): boolean {
    return (
      this.text.includes('サイド') &&
      (this.text.includes('少なくなる') ||
        this.text.includes('多くとる') ||
        this.text.includes('多く取る') ||
        this.text.includes('見る') ||
        this.text.includes('入れかえる') ||
        this.text.includes('とられる'))
    );
  }

  parse(): PrizeEffect | null {
    if (!this.canParse()) return null;

    // Prize reduction: サイドは1枚少なくなる or とられるサイドは1枚少なくなる
    if (this.text.includes('少なくなる')) {
      const countMatch = this.text.match(/(\d+)枚少なくなる/);
      const count = countMatch ? parseInt(countMatch[1], 10) : 1;
      return this.createPrizeEffect('take-extra', -count);
    }

    // Extra prize: サイドを1枚多くとる
    if (this.text.includes('多くとる') || this.text.includes('多く取る')) {
      const countMatch = this.text.match(/(\d+)枚多く/);
      const count = countMatch ? parseInt(countMatch[1], 10) : 1;
      return this.createPrizeEffect('take-extra', count);
    }

    // Look at prizes: サイドを見る
    if (this.text.includes('サイド') && this.text.includes('見る')) {
      const countMatch = this.text.match(/(\d+)枚/);
      const count = countMatch ? parseInt(countMatch[1], 10) : undefined;
      return this.createPrizeEffect('look', count);
    }

    // Swap prizes: サイドを入れかえる
    if (this.text.includes('入れかえる')) {
      return this.createPrizeEffect('swap');
    }

    return null;
  }

  private createPrizeEffect(
    action: 'take-extra' | 'look' | 'swap' | 'put-back',
    count?: number
  ): PrizeEffect {
    const effect: PrizeEffect = {
      type: EffectType.Prize,
      action,
    };

    if (count !== undefined) {
      effect.count = count;
    }

    // Determine target player
    const isOpponent = this.text.includes('相手');
    const target: Target = {
      type: 'card',
      player: isOpponent ? 'opponent' : 'self',
      location: { type: 'prize' },
    };
    effect.targets = [target];

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }
}
