import { BaseParser } from './base-parser';
import { Effect, EffectType, StatusEffect } from '../types';

export class StatusParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('状態');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const status = this.parseStatusType();
    if (!status) return null;

    const effect: Partial<StatusEffect> = {
      type: EffectType.Status,
      status,
      targets: [
        {
          type: 'pokemon',
          player: 'opponent',
          location: {
            type: 'active',
          },
        },
      ],
    };

    return effect as Effect;
  }

  private parseStatusType(): StatusEffect['status'] | null {
    if (this.text.includes('マヒ状態')) return 'paralyzed';
    if (this.text.includes('眠り状態')) return 'asleep';
    if (this.text.includes('こんらん状態')) return 'confused';
    if (this.text.includes('やけど')) return 'burned';
    if (this.text.includes('どく')) return 'poisoned';
    return null;
  }
}
