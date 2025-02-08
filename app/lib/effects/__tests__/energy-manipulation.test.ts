import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Energy Manipulation Effects', () => {
  it('should parse energy discard effect', async () => {
    const text = 'エネルギーを2個トラッシュする';
    const expectedEffects = [
      {
        type: EffectType.Discard,
        targets: [
          {
            type: 'energy',
            player: 'self',
            location: {
              type: 'discard',
            },
            count: 2,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse energy attach from discard effect', async () => {
    const text =
      '自分のトラッシュから基本エネルギーを2枚まで選び、ベンチポケモン1匹につける。';

    const expectedEffects = [
      {
        type: EffectType.Search,
        targets: [
          {
            type: 'energy',
            player: 'self',
            location: {
              type: 'discard',
            },
            count: 2,
            filters: [
              {
                type: 'card-type',
                value: 'basic',
              },
            ],
          },
        ],
      },
      {
        type: EffectType.Energy,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'bench',
            },
            count: 2,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
