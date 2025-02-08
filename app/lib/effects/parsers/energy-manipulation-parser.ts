import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class EnergyManipulationParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('エネルギー') &&
      (this.text.includes('トラッシュ') || this.text.includes('山札'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const count = this.text.includes('2枚') ? 2 : 1;

    if (this.text.includes('トラッシュ') && this.text.includes('つける')) {
      effects.push({
        type: EffectType.Search,
        targets: [
          {
            type: 'energy',
            player: 'self',
            count,
            filters: [
              {
                type: 'card-type',
                value: 'basic',
              },
            ],
            location: {
              type: 'discard',
            },
          },
        ],
      });

      effects.push({
        type: EffectType.Place,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            count,
            location: {
              type: 'bench',
            },
          },
        ],
      });
    }

    return effects;
  }
}
