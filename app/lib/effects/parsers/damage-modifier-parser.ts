import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DamageModifierParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('効果を計算しない');
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

    return effect as Effect;
  }
}
