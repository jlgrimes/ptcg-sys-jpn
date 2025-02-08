import { BaseParser } from './base-parser';
import { Effect, EffectType, Target } from '../types';

export class DamageParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('ダメージ');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const damageValue = this.parseDamageValue();
    if (damageValue === 0) return null;

    const target: Partial<Target> = {
      type: 'pokemon',
      player: 'opponent',
      count: 1,
    };

    // Only add location if explicitly specified
    if (this.text.includes('バトルポケモン')) {
      target.location = { type: 'active' };
    } else if (
      this.text.includes('ベンチポケモン') ||
      this.text.includes('ベンチの')
    ) {
      target.location = { type: 'bench' };
    }

    return this.createEffect(EffectType.Damage, {
      value: damageValue,
      targets: [target as Target],
    });
  }
}
