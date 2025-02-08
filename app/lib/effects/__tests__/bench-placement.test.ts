import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Bench Placement Effects', () => {
  it('should parse placing basic pokemon from deck', async () => {
    const text =
      '山札からたねポケモンを1枚選び、ベンチに出す。その後、山札を切る。';
    const expectedEffects = [
      {
        type: EffectType.Place,
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
                value: 'basic',
              },
            ],
          },
        ],
      },
      {
        type: EffectType.Search,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'deck',
              shuffle: true,
            },
            count: 1,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse placing stage1 pokemon from hand', async () => {
    const text = '自分の手札から1進化ポケモンを2枚まで選び、ベンチに出す。';

    const expectedEffects = [
      {
        type: EffectType.Place,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'bench',
            },
            count: 2,
            filters: [
              {
                type: 'card-type',
                value: 'stage1',
              },
            ],
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse placing stage2 pokemon from deck without choice', async () => {
    const text = '山札から2進化ポケモンを1枚ベンチに出す。その後、山札を切る。';

    const expectedEffects = [
      {
        type: EffectType.Place,
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
                value: 'stage2',
              },
            ],
          },
        ],
      },
      {
        type: EffectType.Search,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'deck',
              shuffle: true,
            },
            count: 1,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse placing opponent pokemon', async () => {
    const text =
      '相手の山札からたねポケモンを1枚選び、相手のベンチに出す。山札を切る。';

    const expectedEffects = [
      {
        type: EffectType.Place,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'bench',
            },
            count: 1,
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
        type: EffectType.Search,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'deck',
              shuffle: true,
            },
            count: 1,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
