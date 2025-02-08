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
    const count = this.text.includes('まで') ? this.parseCount('energy') : 1;
    const filters = this.text.includes('基本エネルギー')
      ? [{ type: 'card-type' as const, value: 'basic' }]
      : undefined;

    if (this.text.includes('トラッシュする')) {
      effects.push(
        this.createEffect(EffectType.Discard, {
          targets: [
            {
              type: 'energy',
              player,
              location: { type: 'discard' },
              count,
            },
          ],
        })
      );
      return effects;
    }

    // Handle attach effect
    if (this.text.includes('トラッシュから')) {
      effects.push(
        this.createEffect(EffectType.Search, {
          targets: [
            {
              type: 'energy',
              player,
              location: { type: 'discard' },
              count,
              ...(filters && { filters }),
            },
          ],
        })
      );
    }

    effects.push(
      this.createEffect(EffectType.Energy, {
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
      })
    );

    return effects;
  }
}
