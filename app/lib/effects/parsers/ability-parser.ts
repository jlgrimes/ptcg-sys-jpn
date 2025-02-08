import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class AbilityParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('特性');
  }

  parse(): Effect | Effect[] | null {
    if (!this.canParse()) return null;

    const effects: Effect[] = [];

    // Parse ability effect
    const abilityEffect: Partial<Effect> = {
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

    // Parse timing restrictions
    if (this.text.includes('1ターンに1回')) {
      const abilityName = this.parseAbilityName();
      abilityEffect.timing = {
        type: 'once-per-turn',
        restriction: {
          type: 'ability-not-used',
          abilityName,
        },
      };
    }

    // Parse continuous effects
    if (this.text.includes('バトルポケモンのとき')) {
      abilityEffect.timing = {
        type: 'continuous',
        condition: 'active',
      };
    }

    // Parse coin flip conditions with damage prevention
    if (
      this.text.includes('コインを') &&
      this.text.includes('ダメージを受けない')
    ) {
      abilityEffect.conditions = [
        {
          type: 'coin-flip',
          value: 1,
          onSuccess: [
            {
              type: EffectType.Status,
              modifiers: [
                {
                  type: 'prevent',
                  what: 'damage',
                },
              ],
            },
          ],
        },
      ];
    }

    // Parse modifiers
    if (this.text.includes('効果を受けない')) {
      abilityEffect.modifiers = [
        {
          type: 'immunity',
          what: 'ability',
        },
      ];
    } else if (this.text.includes('特性は無効')) {
      abilityEffect.modifiers = [
        {
          type: 'nullify',
          what: 'ability',
        },
      ];
    }

    effects.push(abilityEffect as Effect);

    // Parse search effect if present
    if (this.text.includes('山札から') && this.text.includes('手札に加える')) {
      const searchEffect: Effect = {
        type: EffectType.Search,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'deck',
            },
            count: 1,
          },
        ],
        timing: {
          type: 'once-per-turn',
          restriction: {
            type: 'ability-not-used',
            abilityName: this.parseAbilityName(),
          },
        },
      };
      effects.push(searchEffect);
    }

    return effects.length === 1 ? effects[0] : effects;
  }

  private parseAbilityName(): string {
    const match = this.text.match(/特性「([^」]+)」/);
    return match ? match[1] : '';
  }
}
