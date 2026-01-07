import { BaseParser } from './base-parser';
import { Effect, EffectType, RetreatModifierEffect, Target } from '../types';

/**
 * Parses retreat cost modification effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - にげるためのエネルギーは、すべてなくなる: "Retreat cost becomes 0"
 * - にげるためのエネルギーが1個少なくなる: "Retreat cost reduced by 1"
 * - にげるためのエネルギーが2個多くなる: "Retreat cost increased by 2"
 */
export class RetreatModifierParser extends BaseParser<RetreatModifierEffect> {
  canParse(): boolean {
    return (
      (this.text.includes('にげる') || this.text.includes('逃げる')) &&
      (this.text.includes('エネルギー') || this.text.includes('なくなる')) &&
      !this.text.includes('にげられない') // Don't match retreat block
    );
  }

  parse(): RetreatModifierEffect | null {
    if (!this.canParse()) return null;

    // Retreat cost becomes 0: にげるためのエネルギーは、すべてなくなる
    if (
      this.text.includes('すべてなくなる') ||
      this.text.includes('なくなる')
    ) {
      return this.createRetreatModifierEffect(-99); // -99 indicates "set to 0"
    }

    // Retreat cost reduced: にげるためのエネルギーが1個少なくなる
    const reduceMatch = this.text.match(
      /にげる.*エネルギー[がは]?(\d+)個[ぶん]?少なくなる/
    );
    if (reduceMatch) {
      return this.createRetreatModifierEffect(-parseInt(reduceMatch[1], 10));
    }

    // Retreat cost increased: にげるためのエネルギーが2個多くなる
    const increaseMatch = this.text.match(
      /にげる.*エネルギー[がは]?(\d+)個[ぶん]?多くなる/
    );
    if (increaseMatch) {
      return this.createRetreatModifierEffect(parseInt(increaseMatch[1], 10));
    }

    // General energy reduction pattern: エネルギー1個ぶん少なくなり
    const generalReduceMatch = this.text.match(/エネルギー(\d+)個ぶん少なくなり/);
    if (generalReduceMatch) {
      return this.createRetreatModifierEffect(
        -parseInt(generalReduceMatch[1], 10)
      );
    }

    return null;
  }

  private createRetreatModifierEffect(
    modification: number
  ): RetreatModifierEffect {
    const effect: RetreatModifierEffect = {
      type: EffectType.RetreatModifier,
      modification,
    };

    // Parse target Pokemon
    const target = this.parseRetreatTarget();
    effect.targets = [target];

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseRetreatTarget(): Target {
    const target: Partial<Target> = {
      type: 'pokemon',
    };

    // Check for specific Pokemon targeting
    if (this.text.includes('相手')) {
      target.player = 'opponent';
    } else if (this.text.includes('おたがい')) {
      target.player = 'both';
    } else {
      target.player = 'self';
    }

    // Check for bench vs active
    if (this.text.includes('ベンチ')) {
      target.location = { type: 'bench' };
    } else {
      target.location = { type: 'field' }; // Applies to all field Pokemon
    }

    return target as Target;
  }
}
