import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Discard Draw Effects', () => {
  it('should parse discard then draw effect', async () => {
    const text = '手札を1枚トラッシュして、カードを2枚引く';
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
