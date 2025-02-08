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
    } else if (this.text.includes('無効')) {
      effect.modifiers = [
        {
          type: 'nullify',
          what: 'ability',
        },
      ];
    }

    if (this.text.includes('1回使える')) {
      effect.timing = {
        type: 'once-per-turn',
        restriction: {
          type: 'ability-not-used',
          abilityName: this.parseAbilityName(),
        },
      };
    } else if (this.text.includes('バトルポケモンのとき')) {
      effect.timing = {
        type: 'continuous',
        condition: 'active',
      };
    }

    const conditions = this.parseConditions();
    if (conditions) {
      effect.conditions = conditions.map(condition => {
        if (condition.type === 'coin-flip') {
          return {
            ...condition,
            onSuccess: [
              {
                type: EffectType.Status,
                status: 'paralyzed',
              },
            ],
          };
        }
        return condition;
      });
    }

    return effect as Effect;
  }

  private parseAbilityName(): string {
    const match = this.text.match(/「([^」]+)」/);
    return match ? match[1] : '';
  }
}
