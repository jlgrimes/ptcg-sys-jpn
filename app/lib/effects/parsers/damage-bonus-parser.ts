import { BaseParser } from './base-parser';
import { Effect, EffectType, BaseEffect, Modifier, Target } from '../types';

/**
 * Parses damage bonus/modifier effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - ダメージは「+30」される: "Damage is increased by 30"
 * - ダメージ「+20」: "Damage +20"
 * - 与えるダメージは30大きくなる: "Damage dealt is 30 higher"
 */
export class DamageBonusParser extends BaseParser<BaseEffect> {
  canParse(): boolean {
    return (
      this.text.includes('ダメージ') &&
      (this.text.match(/[「+]?\+?\d+[」]?される/) !== null ||
        this.text.includes('大きくなる') ||
        this.text.includes('小さくなる') ||
        this.text.match(/ダメージ[「+]?\+\d+/) !== null)
    );
  }

  parse(): BaseEffect | null {
    if (!this.canParse()) return null;

    // Pattern: ダメージは「+30」される or ダメージは+30される
    const bonusMatch = this.text.match(/ダメージ[はを]?[「]?\+?(\d+)[」]?される/);
    if (bonusMatch) {
      return this.createDamageBonusEffect(parseInt(bonusMatch[1], 10));
    }

    // Pattern: ダメージ「+20」 (inline modifier)
    const inlineMatch = this.text.match(/ダメージ[「]\+(\d+)[」]/);
    if (inlineMatch) {
      return this.createDamageBonusEffect(parseInt(inlineMatch[1], 10));
    }

    // Pattern: 与えるダメージは30大きくなる
    const increaseMatch = this.text.match(/ダメージ[はが](\d+)大きくなる/);
    if (increaseMatch) {
      return this.createDamageBonusEffect(parseInt(increaseMatch[1], 10));
    }

    // Pattern: 与えるダメージは30小さくなる (damage reduction)
    const decreaseMatch = this.text.match(/ダメージ[はが](\d+)小さくなる/);
    if (decreaseMatch) {
      return this.createDamageBonusEffect(-parseInt(decreaseMatch[1], 10));
    }

    // Pattern: ダメージ「-30」される (damage reduction)
    const reductionMatch = this.text.match(/ダメージ[はを]?[「]-(\d+)[」]?される/);
    if (reductionMatch) {
      return this.createDamageBonusEffect(-parseInt(reductionMatch[1], 10));
    }

    return null;
  }

  private createDamageBonusEffect(value: number): BaseEffect {
    const modifier: Modifier = {
      type: value >= 0 ? 'add' : 'remove',
      what: 'damage',
      value: Math.abs(value),
    };

    const effect: BaseEffect = {
      type: EffectType.Damage,
      modifiers: [modifier],
    };

    // Parse target - who gets the damage bonus
    const target = this.parseDamageTarget();
    effect.targets = [target];

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseDamageTarget(): Target {
    const target: Partial<Target> = {
      type: 'pokemon',
    };

    // Check if it's the opponent's Pokemon receiving more damage
    if (this.text.includes('相手のバトルポケモン')) {
      target.player = 'opponent';
      target.location = { type: 'active' };
    } else if (this.text.includes('相手')) {
      target.player = 'opponent';
      target.location = { type: 'active' };
    } else {
      // Usually the bonus is for damage dealt by self
      target.player = 'self';
      target.location = { type: 'active' };
    }

    return target as Target;
  }
}
