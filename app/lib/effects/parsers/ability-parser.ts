import { BaseParser } from './base-parser';
import { Effect, EffectType, Timing, Target } from '../types';

export class AbilityParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('特性') ||
      this.text.includes('効果を受けない') ||
      (this.text.includes('バトルポケモンのとき') &&
        this.text.includes('コインを') &&
        this.text.includes('ダメージを受けない'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const targets = this.parseTargets();

    // Base ability effect
    const abilityEffect: Effect = {
      type: EffectType.Ability,
      targets,
    };

    // Add timing only for specific cases
    const timing = this.parseTiming();
    if (timing) {
      abilityEffect.timing = timing;
    }

    // Add coin flip damage prevention
    if (
      this.text.includes('バトルポケモンのとき') &&
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
      abilityEffect.timing = {
        type: 'continuous',
        condition: 'active',
      };
      abilityEffect.targets = [
        {
          type: 'pokemon',
          player: 'self',
          location: {
            type: 'active',
          },
        },
      ];
      effects.push(abilityEffect);
      return effects;
    }

    // Add ability immunity
    if (this.text.includes('効果を受けない')) {
      abilityEffect.modifiers = [
        {
          type: 'immunity',
          what: 'ability',
        },
      ];
    }

    // Add ability nullification
    if (this.text.includes('特性は無効')) {
      abilityEffect.modifiers = [
        {
          type: 'nullify',
          what: 'ability',
        },
      ];
    }

    effects.push(abilityEffect);

    // Add search effect for once per turn abilities
    if (this.text.includes('山札から') && this.text.includes('手札に加える')) {
      effects.push({
        type: EffectType.Search,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            count: 1,
            location: {
              type: 'deck',
            },
          },
        ],
        timing: {
          type: 'once-per-turn',
          restriction: {
            type: 'ability-not-used',
            abilityName: this.parseAbilityName(),
          },
        },
      });
    }

    return effects;
  }

  protected parseTiming(): Timing | undefined {
    if (this.text.includes('バトルポケモンのとき')) {
      return {
        type: 'continuous',
        condition: 'active',
      };
    }
    if (this.text.includes('1ターンに1回')) {
      return {
        type: 'once-per-turn',
        restriction: {
          type: 'ability-not-used',
          abilityName: this.parseAbilityName(),
        },
      };
    }
    return undefined;
  }

  protected parseTargets(): Target[] {
    return [
      {
        type: 'pokemon',
        player: this.text.includes('相手の') ? 'opponent' : 'self',
        location: {
          type: 'active',
        },
      },
    ];
  }

  protected parseAbilityName(): string {
    const match = this.text.match(/「(.+?)」/);
    return match ? match[1] : '';
  }
}
