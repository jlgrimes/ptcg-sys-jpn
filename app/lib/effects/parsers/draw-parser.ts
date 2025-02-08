import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DrawParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('引く') || this.text.includes('になるように');
  }

  parse(): Effect | null {
    if (!this.canParse()) return null;

    const effect = this.createEffect(EffectType.Draw, {
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

    // Handle specific hand size condition
    const handSizeMatch = this.text.match(/(\d+)枚になるように/);
    if (handSizeMatch) {
      effect.conditions = [
        {
          type: 'card-count',
          target: {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'hand',
            },
          },
          value: parseInt(handSizeMatch[1]),
          comparison: 'equal',
        },
      ];
    } else {
      // Regular draw count
      const drawMatch = this.text.match(/(\d+)枚引く/);
      if (drawMatch) {
        effect.value = parseInt(drawMatch[1]);
      }
    }

    return effect;
  }
}
