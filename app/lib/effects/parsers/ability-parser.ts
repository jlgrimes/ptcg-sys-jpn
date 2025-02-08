import { BaseParser } from './base-parser';
import { Effect, EffectType, Timing, Target } from '../types';

export class AbilityParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('特性「') ||
      this.text.includes('効果を受けない') ||
      (this.text.includes('バトルポケモンのとき') &&
        this.text.includes('コインを') &&
        this.text.includes('ダメージを受けない')) ||
      (this.text.includes('自分の番に1回使える') &&
        this.text.includes('山札を')) ||
      (this.text.includes('進化させたとき') &&
        this.text.includes('1回使える')) ||
      this.text.includes('特性は無効') ||
      (this.text.includes('1ターンに1回使える') &&
        this.text.includes('山札から'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const targets = this.parseTargets();
    const timing = this.parseTiming();
    const abilityName = this.parseAbilityName();

    // Base ability effect
    const abilityEffect: Effect = {
      type: EffectType.Ability,
      targets,
    };

    // Add timing if present
    if (timing) {
      abilityEffect.timing = timing;
      if (timing.restriction?.type === 'ability-not-used' && abilityName) {
        timing.restriction.abilityName = abilityName;
      }
    }

    // Add conditions for Terastal check
    if (this.text.includes('テラスタル」のポケモンがいるなら')) {
      abilityEffect.conditions = [
        {
          type: 'card-count',
          target: {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'field',
            },
            filters: [
              {
                type: 'card-type',
                value: 'テラスタル',
              },
            ],
          },
        },
      ];
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
      abilityEffect.timing = {
        type: 'continuous',
        condition: 'active',
      };
    }

    effects.push(abilityEffect);

    // Add search effect for once per turn abilities
    if (this.text.includes('山札から') && this.text.includes('手札に加える')) {
      const searchEffect: Effect = {
        type: EffectType.Search,
        targets: [
          {
            type: this.text.includes('トレーナーズ') ? 'trainer' : 'pokemon',
            player: 'self',
            count: this.parseCount(
              this.text.includes('トレーナーズ') ? 'trainer' : 'pokemon'
            ),
            location: {
              type: 'deck',
              ...(this.text.includes('見せ') && { reveal: true }),
            },
            ...(this.text.includes('トレーナーズ') && {
              filters: [
                {
                  type: 'card-type',
                  value: 'トレーナーズ',
                },
              ],
            }),
          },
        ],
      };

      // Add timing if present
      if (timing) {
        searchEffect.timing = timing;
      }

      effects.push(searchEffect);
    }

    // Add draw effect for once per turn abilities
    if (this.text.includes('山札を') && this.text.includes('枚引く')) {
      const drawMatch = this.text.match(/山札を(\d+)枚引く/);
      if (drawMatch) {
        const drawEffect: Effect = {
          type: EffectType.Draw,
          value: parseInt(drawMatch[1]),
          targets: [
            {
              type: 'pokemon',
              player: 'self',
              location: {
                type: 'deck',
              },
            },
          ],
        };

        if (timing) {
          drawEffect.timing = timing;
        }

        effects.push(drawEffect);
      }
    }

    // Add shuffle effect if needed
    if (this.text.includes('山札を切る')) {
      effects.push({
        type: EffectType.Shuffle,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'deck',
            },
          },
        ],
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
    if (this.text.includes('進化させたとき')) {
      return {
        type: 'on-evolution',
        restriction: {
          type: 'ability-not-used',
          abilityName: '',
        },
      };
    }
    if (
      this.text.includes('1ターンに1回') ||
      this.text.includes('自分の番に1回使える')
    ) {
      return {
        type: 'once-per-turn',
        restriction: {
          type: 'ability-not-used',
          abilityName: '',
        },
      };
    }
    return undefined;
  }

  protected parseTargets(): Target[] {
    const isOpponent =
      this.text.includes('相手のバトルポケモン') ||
      this.text.includes('相手の特性');
    return [
      {
        type: 'pokemon',
        player: isOpponent ? 'opponent' : 'self',
        location: {
          type: 'active',
        },
      },
    ];
  }

  protected parseAbilityName(): string {
    const match = this.text.match(/特性「(.+?)」/);
    if (match) {
      return match[1];
    }
    if (this.text.includes('「さかてにとる」')) {
      return 'さかてにとる';
    }
    return '';
  }
}
