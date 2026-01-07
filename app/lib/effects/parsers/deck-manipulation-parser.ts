import { BaseParser } from './base-parser';
import { Effect, EffectType, DeckManipulationEffect, Target } from '../types';

/**
 * Parses deck manipulation effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - 山札を見る: "自分の山札を上から3枚見る"
 * - 並べ替える: "好きな順番に並べ替える"
 * - 上に置く: "山札の上にもどす"
 * - 下に置く: "山札の下にもどす"
 */
export class DeckManipulationParser extends BaseParser<DeckManipulationEffect> {
  canParse(): boolean {
    // Deck looking
    if (this.text.includes('山札') && this.text.includes('見る')) {
      return true;
    }
    // Rearranging
    if (this.text.includes('好きな順番') || this.text.includes('並べ替え')) {
      return true;
    }
    // Put on top/bottom
    if (this.text.includes('山札の上') || this.text.includes('山札の下')) {
      return true;
    }
    return false;
  }

  parse(): DeckManipulationEffect | DeckManipulationEffect[] | null {
    if (!this.canParse()) return null;

    // Look at deck: 山札を上から3枚見る
    const lookMatch = this.text.match(/山札[をの]上から(\d+)枚見る/);
    if (lookMatch) {
      return this.createDeckEffect('look', parseInt(lookMatch[1], 10));
    }

    // Look at entire deck (rare): 山札を見る (without count)
    if (this.text.includes('山札を見る') && !this.text.match(/\d+枚/)) {
      return this.createDeckEffect('look', -1); // -1 indicates all
    }

    // Rearrange: 好きな順番に並べ替える
    if (this.text.includes('好きな順番') || this.text.includes('並べ替え')) {
      const count = this.parseRearrangeCount();
      return this.createDeckEffect('rearrange', count);
    }

    // Put on top: 山札の上にもどす
    if (this.text.includes('山札の上') && (this.text.includes('もどす') || this.text.includes('置く'))) {
      return this.createDeckEffect('put-on-top', this.parsePutCount());
    }

    // Put on bottom: 山札の下にもどす
    if (this.text.includes('山札の下') && (this.text.includes('もどす') || this.text.includes('置く'))) {
      return this.createDeckEffect('put-on-bottom', this.parsePutCount());
    }

    // Shuffle into deck: 山札にもどしてシャッフル
    if (this.text.includes('山札にもどし') && this.text.includes('切る')) {
      return this.createDeckEffect('shuffle-into', this.parsePutCount());
    }

    return null;
  }

  private createDeckEffect(
    action: 'look' | 'rearrange' | 'put-on-top' | 'put-on-bottom' | 'shuffle-into',
    count?: number
  ): DeckManipulationEffect {
    const player = this.parsePlayer();

    const target: Target = {
      type: 'card',
      player,
      location: { type: 'deck' },
      count: count || undefined,
    };

    const effect: DeckManipulationEffect = {
      type: EffectType.DeckManipulation,
      action,
      targets: [target],
    };

    if (count !== undefined && count > 0) {
      effect.count = count;
    }

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseRearrangeCount(): number {
    // Look for "見た" (looked at) count from previous action
    const lookMatch = this.text.match(/(\d+)枚見/);
    if (lookMatch) {
      return parseInt(lookMatch[1], 10);
    }

    // Look for direct count
    const countMatch = this.text.match(/(\d+)枚/);
    if (countMatch) {
      return parseInt(countMatch[1], 10);
    }

    return 0; // Unknown count
  }

  private parsePutCount(): number {
    const countMatch = this.text.match(/(\d+)枚/);
    if (countMatch) {
      return parseInt(countMatch[1], 10);
    }
    return 1; // Default to 1
  }
}
