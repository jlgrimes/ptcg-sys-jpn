import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class AbilityParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('特性');
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const player = this.text.includes('相手の') ? 'opponent' : 'self';

    const abilityEffect = this.createEffect(EffectType.Ability, {
      targets: [
        {
          type: 'pokemon',
          player,
          location: { type: 'active' },
        },
      ],
      timing: {
        type: 'continuous',
        condition: 'active',
      },
    });

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

    if (this.text.includes('効果を受けない')) {
      abilityEffect.modifiers = [
        {
          type: 'immunity',
          what: 'ability',
        },
      ];
    }

    effects.push(abilityEffect);

    // Parse search effect if present
    if (this.text.includes('山札から') && this.text.includes('手札に加える')) {
      effects.push(
        this.createEffect(EffectType.Search, {
          targets: [
            {
              type: 'pokemon',
              player: 'self',
              location: { type: 'deck' },
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
        })
      );
    }

    return effects;
  }
}
