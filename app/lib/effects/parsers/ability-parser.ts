import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class AbilityParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('特性') ||
      this.text.includes('効果を受けない') ||
      this.text.includes('バトルポケモンのとき')
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect: Partial<Effect> = {
      type: EffectType.Ability,
      targets: [
        {
          type: 'pokemon',
          player: this.text.includes('相手の') ? 'opponent' : 'self',
          location: {
            type: 'active',
          },
        },
      ],
    };

    if (this.text.includes('効果を受けない')) {
      effect.modifiers = [
        {
          type: 'immunity',
          what: 'ability',
        },
      ];
    } else if (this.text.includes('コインを')) {
      effect.conditions = [
        {
          type: 'coin-flip',
          value: 1,
          onSuccess: [
            {
              type: EffectType.Status,
              status: 'paralyzed',
            },
          ],
        },
      ];
    }

    if (this.text.includes('バトルポケモンのとき')) {
      effect.timing = {
        type: 'continuous',
        condition: 'active',
      };
    }

    return effect as Effect;
  }
}
