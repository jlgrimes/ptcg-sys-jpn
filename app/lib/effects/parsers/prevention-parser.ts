import { BaseParser } from './base-parser';
import { Effect, EffectType, PreventionEffect, Target } from '../types';

/**
 * Parses damage/effect prevention from Japanese Pokemon TCG text
 *
 * Patterns:
 * - ダメージを受けない: "次の相手の番、このポケモンはワザのダメージを受けない"
 * - ダメージ軽減: "このポケモンが受けるワザのダメージを-30する"
 * - 効果を受けない: "このポケモンは相手のワザの効果を受けない"
 */
export class PreventionParser extends BaseParser<PreventionEffect> {
  canParse(): boolean {
    // Be specific about prevention patterns - don't match ability immunity
    return (
      this.text.includes('ダメージを受けない') ||
      this.text.includes('ダメージは受けない') ||
      (this.text.includes('ワザの効果') && this.text.includes('受けない')) ||
      (this.text.includes('すべて') && this.text.includes('防ぐ')) ||
      (this.text.includes('ダメージ') && this.text.includes('する') && !!this.text.match(/-\d+/)) ||
      this.text.match(/受ける.*ダメージ[をは]「?-\d+/) !== null
    );
  }

  parse(): PreventionEffect | null {
    if (!this.canParse()) return null;

    // Full damage prevention: ダメージを受けない
    if (this.text.includes('ダメージを受けない') || this.text.includes('ダメージは受けない')) {
      return this.createPreventionEffect('damage', this.parseDuration());
    }

    // Effect prevention: 効果を受けない
    if (this.text.includes('効果を受けない')) {
      return this.createPreventionEffect('effects', this.parseDuration());
    }

    // Damage reduction: ダメージを-30する or -30する
    const reductionMatch = this.text.match(/ダメージ[をは]?「?-(\d+)」?する/);
    if (reductionMatch) {
      return this.createPreventionEffect('damage', this.parseDuration(), parseInt(reductionMatch[1], 10));
    }

    // Alternative reduction pattern: 受けるダメージは-30される
    const altReductionMatch = this.text.match(/受ける.*ダメージ[をは]「?-(\d+)」?される/);
    if (altReductionMatch) {
      return this.createPreventionEffect('damage', this.parseDuration(), parseInt(altReductionMatch[1], 10));
    }

    // Prevent all: すべて防ぐ
    if (this.text.includes('すべて') && this.text.includes('防ぐ')) {
      return this.createPreventionEffect('all', this.parseDuration());
    }

    return null;
  }

  private createPreventionEffect(
    preventType: 'damage' | 'effects' | 'all',
    duration: 'next-attack' | 'next-turn' | 'while-active',
    reduction?: number
  ): PreventionEffect {
    const target = this.parsePreventionTarget();

    const effect: PreventionEffect = {
      type: EffectType.Prevention,
      preventType,
      duration,
      targets: [target],
    };

    if (reduction !== undefined) {
      effect.reduction = reduction;
    }

    if (this.timing) {
      effect.timing = this.timing;
    }

    return effect;
  }

  private parseDuration(): 'next-attack' | 'next-turn' | 'while-active' {
    if (this.text.includes('次の相手の番')) {
      return 'next-turn';
    }
    if (this.text.includes('次のワザ') || this.text.includes('次の攻撃')) {
      return 'next-attack';
    }
    if (this.text.includes('バトル場にいる限り') || this.text.includes('いる限り')) {
      return 'while-active';
    }
    // Default to next turn for most prevention effects
    return 'next-turn';
  }

  private parsePreventionTarget(): Target {
    const target: Partial<Target> = {
      type: 'pokemon',
      player: 'self', // Prevention usually applies to own Pokemon
    };

    if (this.text.includes('ベンチ')) {
      target.location = { type: 'bench' };
    } else {
      target.location = { type: 'active' };
    }

    target.count = 1;

    return target as Target;
  }
}
