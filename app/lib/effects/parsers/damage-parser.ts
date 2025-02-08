import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DamageParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('ダメージ');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const damageValue = this.parseDamageValue();
    if (damageValue === 0) return null;

    return this.createEffect(EffectType.Damage, {
      value: damageValue,
      targets: [
        {
          type: 'pokemon',
          player: 'opponent',
          location: { type: 'active' },
        },
      ],
    });
  }
}
