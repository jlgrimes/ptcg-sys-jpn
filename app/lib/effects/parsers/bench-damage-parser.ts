import { BaseParser } from './base-parser';
import { Effect, EffectType, Target } from '../types';

export class BenchDamageParser extends BaseParser<Effect> {
  canParse(): boolean {
    // Only parse if it's about damage
    return (
      this.text.includes('ダメージ') && !this.text.includes('効果を計算しない') // Avoid matching when it's about effect calculation
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const count = this.text.includes('全員') ? 'all' : 1;
    const damageValue = this.parseDamageValue();
    if (damageValue === 0) return null;

    const target: Partial<Target> = {
      type: 'pokemon',
      player: this.text.includes('自分の') ? 'self' : 'opponent',
      count,
    };

    // Only add location if explicitly specified
    if (
      this.text.includes('ベンチポケモン') ||
      this.text.includes('ベンチの')
    ) {
      target.location = { type: 'bench' };
    } else if (this.text.includes('バトルポケモン')) {
      target.location = { type: 'active' };
    }

    return this.createEffect(EffectType.Damage, {
      value: damageValue,
      targets: [target as Target],
      ...(this.text.includes('弱点・抵抗力を計算しない') && {
        modifiers: [{ type: 'ignore', what: 'effects' }],
      }),
    });
  }
}
