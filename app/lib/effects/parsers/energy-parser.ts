import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class EnergyParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('エネルギー') &&
      (this.text.includes('つける') || this.text.includes('トラッシュ'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const player = this.text.includes('相手の') ? 'opponent' : 'self';
    const count = this.parseCount('energy');
    const filters = this.text.includes('基本エネルギー')
      ? [{ type: 'card-type' as const, value: 'basic' }]
      : undefined;

    if (this.text.includes('トラッシュする')) {
      // Handle discard effect
      effects.push({
        type: EffectType.Discard,
        targets: [
          {
            type: 'energy',
            player,
            location: {
              type: 'discard',
            },
            count,
          },
        ],
      });
    } else {
      // Handle attach effect
      if (this.text.includes('トラッシュから')) {
        // If attaching from discard, add search effect first
        effects.push({
          type: EffectType.Search,
          targets: [
            {
              type: 'energy',
              player,
              location: {
                type: 'discard',
              },
              count,
              ...(filters && { filters }),
            },
          ],
        });
      }

      // Add energy attach effect
      effects.push({
        type: EffectType.Energy,
        targets: [
          {
            type: 'pokemon',
            player,
            location: {
              type: this.text.includes('ベンチ') ? 'bench' : 'active',
            },
            count: 1,
          },
        ],
      });
    }

    return effects;
  }
}
