import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class DiscardParser extends BaseParser<Effect> {
  canParse(): boolean {
    return this.text.includes('トラッシュ');
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];

    // Add discard effect
    effects.push(
      this.createEffect(EffectType.Discard, {
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: { type: 'discard' },
            count: this.parseCount(),
          },
        ],
      })
    );

    // Add draw effect if present
    if (this.text.includes('引く')) {
      const drawMatch = this.text.match(/(\d+)枚引く/);
      if (drawMatch) {
        effects.push(
          this.createEffect(EffectType.Draw, {
            value: parseInt(drawMatch[1]),
            targets: [
              {
                type: 'pokemon',
                player: 'self',
                location: { type: 'deck' },
              },
            ],
          })
        );
      }
    }

    return effects;
  }

  protected parseCount(): number {
    const match = this.text.match(/(\d+)(枚|個)/);
    return match ? parseInt(match[1]) : 1;
  }
}
