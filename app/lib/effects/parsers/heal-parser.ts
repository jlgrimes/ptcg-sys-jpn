import { BaseParser } from './base-parser';
import { Effect, EffectType, HealEffect, Target } from '../types';

/**
 * Parses healing effects from Japanese Pokemon TCG text
 *
 * Patterns:
 * - HP回復: "このポケモンのHPを30回復" (Heal this Pokemon's HP by 30)
 * - ダメカン除去: "ダメカンを2個取る" (Remove 2 damage counters)
 * - 全回復: "すべて回復" (Heal all)
 */
export class HealParser extends BaseParser<HealEffect> {
  canParse(): boolean {
    return (
      this.text.includes('回復') ||
      (this.text.includes('ダメカン') && this.text.includes('取る')) ||
      (this.text.includes('ダメカン') && this.text.includes('のせかえる'))
    );
  }

  parse(): HealEffect | null {
    if (!this.canParse()) return null;

    // HP healing pattern: HPを30回復 or 30回復 or 「100」回復
    const hpMatch = this.text.match(/(?:HPを)?[「]?(\d+)[」]?回復/);
    if (hpMatch) {
      return this.createHealEffect(parseInt(hpMatch[1], 10), 'hp');
    }

    // Heal all HP: HP全回復 or すべて回復
    if (this.text.includes('すべて回復') || this.text.includes('全回復')) {
      return this.createHealEffect(-1, 'hp'); // -1 indicates full heal
    }

    // Damage counter removal: ダメカンを2個取る
    const counterMatch = this.text.match(/ダメカンを?(\d+)個(まで)?取る/);
    if (counterMatch) {
      return this.createHealEffect(parseInt(counterMatch[1], 10), 'damage-counters');
    }

    // Remove all damage counters: ダメカンをすべて取る
    if (this.text.includes('ダメカン') && this.text.includes('すべて') && this.text.includes('取る')) {
      return this.createHealEffect(-1, 'damage-counters');
    }

    return null;
  }

  private createHealEffect(value: number, unit: 'hp' | 'damage-counters'): HealEffect {
    const target = this.parseHealTarget();

    const effect: HealEffect = {
      type: EffectType.Heal,
      value,
      unit,
      targets: [target],
    };

    // Add timing if present
    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseHealTarget(): Target {
    const target: Partial<Target> = {
      type: 'pokemon',
      player: this.parsePlayer(),
    };

    // Determine location
    if (this.text.includes('ベンチ')) {
      target.location = { type: 'bench' };
    } else if (this.text.includes('バトルポケモン') || this.text.includes('このポケモン')) {
      target.location = { type: 'active' };
    } else {
      // Default to active for heal effects
      target.location = { type: 'active' };
    }

    // Parse count
    const countMatch = this.text.match(/(\d+)匹/);
    if (countMatch) {
      target.count = parseInt(countMatch[1], 10);
    } else if (this.text.includes('全員') || this.text.includes('すべて')) {
      target.count = 'all';
    } else {
      target.count = 1;
    }

    return target as Target;
  }
}
