import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Count-based Damage Effects', () => {
  it('should parse damage based on Pokemon count', async () => {
    const text = '相手のポケモンexの数×30ダメージ';
    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 30,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'active',
            },
          },
        ],
        conditions: [
          {
            type: 'card-count',
            target: {
              type: 'pokemon',
              player: 'opponent',
              location: {
                type: 'field',
              },
              filters: [
                {
                  type: 'card-type',
                  value: 'ポケモンex',
                },
              ],
            },
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse damage based on trainer card count', async () => {
    const text = '相手の手札を見る。その中のトレーナーズの数×30ダメージ。';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 30,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'active',
            },
          },
        ],
        conditions: [
          {
            type: 'card-count',
            target: {
              type: 'trainer',
              player: 'opponent',
              location: {
                type: 'hand',
                reveal: true,
              },
              filters: [
                {
                  type: 'card-type',
                  value: 'トレーナーズ',
                },
              ],
            },
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
