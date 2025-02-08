import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DamageModifierParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('効果を計算しない') && this.text.includes('ダメージ')
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const damageValue = this.parseDamageValue();
    const options: Partial<Effect> = {};
    if (damageValue > 0) options.value = damageValue;

    return this.createEffect(EffectType.Damage, options);
  }
}
