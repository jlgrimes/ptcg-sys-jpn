import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DamageModifierParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('効果を計算しない') ||
      this.text.includes('弱点・抵抗力を計算しない')
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Damage,
      targets: [
        {
          type: 'pokemon',
          player: 'opponent',
          location: {
            type: this.text.includes('ベンチ') ? 'bench' : 'active',
          },
        },
      ],
      modifiers: [
        {
          type: 'ignore',
          what: 'effects',
        },
      ],
    };

    // Add value if present in text
    const damageMatch = this.text.match(/(\d+)ダメージ/);
    if (damageMatch) {
      effect.value = parseInt(damageMatch[1]);
    }

    return effect as Effect;
  }
}
