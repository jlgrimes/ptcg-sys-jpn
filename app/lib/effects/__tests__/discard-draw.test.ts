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
            type: 'card',
            player: 'self',
            location: {
              type: 'hand',
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
            type: 'card',
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
  }, 10000);

  it('should parse mill effect from opponent deck', async () => {
    const text = '相手の山札を上から2枚トラッシュする';
    const expectedEffects = [
      {
        type: EffectType.Discard,
        targets: [
          {
            type: 'card',
            player: 'opponent',
            location: {
              type: 'deck',
            },
            count: 2,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  }, 10000);
});
