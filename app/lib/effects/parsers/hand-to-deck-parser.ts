import { BaseParser } from './base-parser';
import { Effect, EffectType } from '../types';

export class HandToDeckParser extends BaseParser<Effect> {
  canParse(): boolean {
    return (
      this.text.includes('手札') &&
      ((this.text.includes('山札の下') && this.text.includes('もどす')) ||
        this.text.includes('山札にもどして切る'))
    );
  }

  parse(): Effect[] {
    if (!this.canParse()) return [];

    const effects: Effect[] = [];
    const isForBoth =
      this.text.includes('おたがいの') || this.text.includes('それぞれ');
    const isShuffleIn = this.text.includes('山札にもどして切る');

    // Add hand to deck effect for each player
    const players: ('self' | 'opponent')[] = isForBoth
      ? ['self', 'opponent']
      : ['self'];
    for (const player of players) {
      if (isShuffleIn) {
        // For shuffling into deck, use Shuffle effect
        effects.push(
          this.createEffect(EffectType.Shuffle, {
            targets: [
              {
                type: 'card',
                player,
                location: { type: 'hand' },
                count: 'all',
              },
              {
                type: 'card',
                player,
                location: { type: 'deck' },
              },
            ],
          })
        );
      } else {
        // For bottom of deck, use Place effect with modifier
        effects.push(
          this.createEffect(EffectType.Place, {
            targets: [
              {
                type: 'card',
                player,
                location: { type: 'hand' },
                count: 'all',
              },
              {
                type: 'card',
                player,
                location: { type: 'deck' },
                count: 'all',
              },
            ],
            modifiers: [
              {
                type: 'add',
                what: 'effects',
                value: 0, // Used to indicate bottom of deck placement
              },
            ],
          })
        );
      }
    }

    // Add draw effect
    if (this.text.includes('山札を')) {
      const drawMatch = this.text.match(/(\d+)枚引く/);
      const drawCount = drawMatch ? parseInt(drawMatch[1]) : undefined;

      for (const player of players) {
        effects.push(
          this.createEffect(EffectType.Draw, {
            targets: [
              {
                type: 'card',
                player,
                location: { type: 'deck' },
              },
            ],
            ...(drawCount
              ? { value: drawCount }
              : {
                  conditions: [
                    {
                      type: 'card-count',
                      target: {
                        type: 'card',
                        player,
                        location: { type: 'prize' },
                      },
                      comparison: 'equal',
                    },
                  ],
                }),
          })
        );
      }
    }

    return effects;
  }
}
