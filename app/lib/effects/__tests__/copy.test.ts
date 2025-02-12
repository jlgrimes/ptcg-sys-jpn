import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Copy Effects', () => {
  it('should parse copy move effect with Pokemon name filter', async () => {
    const text =
      '自分のベンチの「Nのポケモン」が持つワザを1つ選び、このワザとして使う。';
    const expectedEffects = [
      {
        type: EffectType.Copy,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'bench',
            },
            count: 1,
            filters: [
              {
                type: 'card-type',
                value: 'Nのポケモン',
              },
            ],
          },
        ],
        what: 'move',
        count: 1,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse copy move effect without filters', async () => {
    const text =
      '自分のベンチポケモンが持つワザを1つ選び、このワザとして使う。';
    const expectedEffects = [
      {
        type: EffectType.Copy,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'bench',
            },
            count: 1,
          },
        ],
        what: 'move',
        count: 1,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
