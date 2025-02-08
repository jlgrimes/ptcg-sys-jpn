import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class BenchDamageParser extends BaseParser<Effect> {
  canParse(): boolean {
    // Only parse if it's specifically about bench damage
    return (
      (this.text.includes('ベンチポケモン') ||
        this.text.includes('ベンチの')) &&
      this.text.includes('ダメージ') &&
      !this.text.includes('バトルポケモン') && // Avoid matching when it's about battle pokemon
      !this.text.includes('効果を計算しない') // Avoid matching when it's about effect calculation
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const count = this.text.includes('全員') ? 'all' : 1;
    const damageValue = this.parseDamageValue();
    if (damageValue === 0) return null;

    return this.createEffect(EffectType.Damage, {
      value: damageValue,
      targets: [
        {
          type: 'pokemon',
          player: this.text.includes('自分の') ? 'self' : 'opponent',
          location: { type: 'bench' },
          count,
        },
      ],
      ...(this.text.includes('弱点・抵抗力を計算しない') && {
        modifiers: [{ type: 'ignore', what: 'effects' }],
      }),
    });
  }
}
