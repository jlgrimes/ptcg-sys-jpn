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

    return this.createEffect(EffectType.Damage, {
      value: this.parseDamageValue() || undefined,
    });
  }
}
