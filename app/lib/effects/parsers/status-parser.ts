import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class StatusParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('状態') ||
      this.text.includes('効果を受けない') ||
      this.text.includes('特性は無効') ||
      (this.text.includes('コインを') &&
        this.text.includes('ダメージを受けない'))
    );
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    // Handle damage prevention with coin flip
    if (
      this.text.includes('コインを') &&
      this.text.includes('ダメージを受けない')
    ) {
      return this.createEffect(EffectType.Status, {
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'active',
            },
          },
        ],
        conditions: [
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
        ],
      });
    }

    // Handle ability immunity
    if (this.text.includes('効果を受けない')) {
      return this.createEffect(EffectType.Ability, {
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'active',
            },
          },
        ],
        modifiers: [{ type: 'immunity', what: 'ability' }],
      });
    }

    // Handle ability nullification
    if (this.text.includes('特性は無効')) {
      return this.createEffect(EffectType.Ability, {
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'active',
            },
          },
        ],
        modifiers: [{ type: 'nullify', what: 'ability' }],
      });
    }

    // Handle regular status effects
    if (this.text.includes('状態')) {
      return this.createEffect(EffectType.Status, {
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'active',
            },
          },
        ],
        conditions: [
          {
            type: 'coin-flip',
            value: 1,
            onSuccess: [
              {
                type: EffectType.Status,
                status: this.parseStatusType(),
              },
            ],
          },
        ],
      });
    }

    return null;
  }

  private parseStatusType(): Effect['status'] {
    if (this.text.includes('マヒ状態')) return 'paralyzed';
    if (this.text.includes('眠り状態')) return 'asleep';
    if (this.text.includes('こんらん状態')) return 'confused';
    if (this.text.includes('やけど')) return 'burned';
    if (this.text.includes('どく')) return 'poisoned';
    return 'paralyzed';
  }
}
