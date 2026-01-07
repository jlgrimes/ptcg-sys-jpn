import { BaseParser } from './base-parser';
import { Effect, EffectType, BaseEffect, Target } from '../types';

/**
 * Parses devolution effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - 退化させる: "Devolve"
 * - 進化カードを手札に戻す: "Return evolution card to hand"
 * - 〇〇に戻す: "Return to XX (previous stage)"
 */
export class DevolutionParser extends BaseParser<BaseEffect> {
  canParse(): boolean {
    return (
      this.text.includes('退化') ||
      (this.text.includes('進化カード') &&
        (this.text.includes('手札に戻す') || this.text.includes('トラッシュ'))) ||
      (this.text.includes('もどす') && this.text.includes('進化'))
    );
  }

  parse(): BaseEffect | null {
    if (!this.canParse()) return null;

    // Full devolution: 退化させる
    if (this.text.includes('退化')) {
      return this.createDevolutionEffect('devolve');
    }

    // Return evolution card to hand
    if (this.text.includes('進化カード') && this.text.includes('手札に戻す')) {
      return this.createDevolutionEffect('to-hand');
    }

    // Discard evolution card
    if (this.text.includes('進化カード') && this.text.includes('トラッシュ')) {
      return this.createDevolutionEffect('to-discard');
    }

    return null;
  }

  private createDevolutionEffect(
    destination: 'devolve' | 'to-hand' | 'to-discard'
  ): BaseEffect {
    const target = this.parseDevolutionTarget();

    const effect: BaseEffect = {
      type: EffectType.Devolution,
      targets: [target],
    };

    // Add value to track destination
    if (destination === 'to-hand') {
      effect.value = 1; // Evolution card goes to hand
    } else if (destination === 'to-discard') {
      effect.value = 2; // Evolution card goes to discard
    } else {
      effect.value = 0; // Standard devolution
    }

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseDevolutionTarget(): Target {
    const target: Partial<Target> = {
      type: 'pokemon',
    };

    if (this.text.includes('相手')) {
      target.player = 'opponent';
    } else {
      target.player = 'self';
    }

    if (this.text.includes('ベンチ')) {
      target.location = { type: 'bench' };
    } else if (this.text.includes('バトル')) {
      target.location = { type: 'active' };
    } else {
      target.location = { type: 'field' };
    }

    // Parse count
    const countMatch = this.text.match(/(\d+)匹/);
    if (countMatch) {
      target.count = parseInt(countMatch[1], 10);
    } else if (this.text.includes('すべて')) {
      target.count = 'all';
    } else {
      target.count = 1;
    }

    return target as Target;
  }
}
