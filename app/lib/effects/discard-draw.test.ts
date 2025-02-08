import { parseEffectText } from '../effect-parser';
import { EffectType } from './types';

describe('Discard Draw Effects', () => {
  it('should parse discard then draw effect', async () => {
    const text = '自分の手札を1枚トラッシュする。その後、自分の山札を2枚引く。';

    const expectedEffects = [
      {
        type: EffectType.Discard,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'discard',
            },
            count: 1,
          },
        ],
      },
      {
        type: EffectType.Draw,
        value: 2,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'deck',
            },
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
