import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class StatusParser extends BaseParser<Effect> {
  // Status keywords that indicate a status effect
  private static readonly STATUS_KEYWORDS = [
    'マヒ', 'ねむり', 'こんらん', 'やけど', 'どく',
    '状態', // Generic status marker
  ];

  canParse(): boolean {
    // Check for status keywords
    const hasStatusKeyword = StatusParser.STATUS_KEYWORDS.some(k => this.text.includes(k));

    return (
      hasStatusKeyword ||
      this.text.includes('効果を受けない') ||
      this.text.includes('特性は無効') ||
      (this.text.includes('コインを') && this.text.includes('ダメージを受けない'))
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
            location: { type: 'active' },
          },
        ],
        conditions: [
          {
            type: 'coin-flip',
            value: 1,
            onSuccess: [
              {
                type: EffectType.Status,
                modifiers: [{ type: 'prevent', what: 'damage' }],
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
            location: { type: 'active' },
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
            location: { type: 'active' },
          },
        ],
        modifiers: [{ type: 'nullify', what: 'ability' }],
      });
    }

    // Handle direct status application (e.g., "こんらんにする", "どくにする")
    const statusType = this.parseStatusType();
    if (statusType) {
      const player = this.parsePlayer();
      const hasCoinFlip = this.text.includes('コインを');

      const baseEffect = {
        type: EffectType.Status,
        status: statusType,
        targets: [
          {
            type: 'pokemon' as const,
            player,
            location: { type: 'active' as const },
          },
        ],
      };

      if (hasCoinFlip) {
        return this.createEffect(EffectType.Status, {
          ...baseEffect,
          conditions: [
            {
              type: 'coin-flip',
              value: 1,
              onSuccess: [baseEffect],
            },
          ],
        });
      }

      return this.createEffect(EffectType.Status, baseEffect);
    }

    return null;
  }

  private parseStatusType(): Effect['status'] | null {
    // Check for various status patterns
    // "Xにする" pattern (make X)
    if (this.text.includes('マヒ')) return 'paralyzed';
    if (this.text.includes('ねむり')) return 'asleep';
    if (this.text.includes('こんらん')) return 'confused';
    if (this.text.includes('やけど')) return 'burned';
    if (this.text.includes('どく')) return 'poisoned';

    return null;
  }
}
