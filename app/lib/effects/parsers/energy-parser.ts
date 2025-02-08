import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class EnergyParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('エネルギー') &&
      (this.text.includes('つける') || this.text.includes('トラッシュ'))
    );
  }

  parse(): Effect | Effect[] | null {
    if (!this.canParse()) return null;

    const fromDiscard = this.text.includes('トラッシュから');
    const toDiscard = this.text.includes('トラッシュする');
    const player = this.text.includes('相手の') ? 'opponent' : 'self';
    const count = this.parseCount('energy');
    const filters = this.text.includes('基本エネルギー')
      ? [{ type: 'card-type' as const, value: 'basic' }]
      : undefined;

    if (toDiscard) {
      return {
        type: EffectType.Discard,
        targets: [
          {
            type: 'pokemon',
            player,
            location: {
              type: 'discard',
            },
            count,
          },
        ],
      };
    }

    if (fromDiscard) {
      // For attaching from discard, we need to first search the discard pile
      return [
        {
          type: EffectType.Search,
          targets: [
            {
              type: 'energy',
              player,
              location: {
                type: 'discard',
              },
              count,
              filters,
            },
          ],
        },
        {
          type: EffectType.Energy,
          targets: [
            {
              type: 'pokemon',
              player,
              location: {
                type: this.text.includes('ベンチ') ? 'bench' : 'active',
              },
              count,
            },
          ],
        },
      ];
    }

    return {
      type: EffectType.Energy,
      targets: [
        {
          type: 'pokemon',
          player,
          location: {
            type: this.text.includes('ベンチ') ? 'bench' : 'active',
          },
          count,
          filters,
        },
      ],
    };
  }
}
