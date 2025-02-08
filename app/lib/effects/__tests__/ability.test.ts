import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Ability Effects', () => {
  it('should parse once per turn search ability', async () => {
    const text =
      '自分の番に1回使える。自分の山札から好きなカードを1枚選び、手札に加える。そして山札を切る。この番、すでに別の「マッハサーチ」を使っていたなら、この特性は使えない。';
    const expectedEffects = [
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
        timing: {
          type: 'once-per-turn',
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse ability immunity effect', async () => {
    const text = '特性の効果を受けない';
    const expectedEffects = [
      {
        type: EffectType.Ability,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'active',
            },
          },
        ],
        modifiers: [
          {
            type: 'immunity',
            what: 'ability',
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse coin flip damage prevention ability', async () => {
    const text =
      'このポケモンがバトルポケモンのとき、相手のワザのダメージを受けるたびに、コインを1回投げる。「おもて」なら、このポケモンはそのダメージを受けない。';

    const expectedEffects = [
      {
        type: EffectType.Status,
        timing: {
          type: 'continuous',
          condition: 'active',
        },
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'active',
            },
          },
        ],
        conditions: [
          {
            type: 'coin-flip',
            value: 1,
            onSuccess: [
              {
                type: EffectType.Status,
                modifiers: [
                  {
                    type: 'prevent',
                    what: 'damage',
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse ability nullification effect', async () => {
    const text =
      'このポケモンがバトルポケモンのとき、相手のバトルポケモンの特性は無効になる。';

    const expectedEffects = [
      {
        type: EffectType.Ability,
        timing: {
          type: 'continuous',
          condition: 'active',
        },
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'active',
            },
          },
        ],
        modifiers: [
          {
            type: 'nullify',
            what: 'ability',
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse draw ability with condition', async () => {
    const text =
      '前の相手の番に、自分のポケモンがきぜつしていたなら、自分の番に1回使える。自分の山札を3枚引く。この番、すでに別の「さかてにとる」を使っていたなら、この特性は使えない。';

    const expectedEffects = [
      {
        type: EffectType.Draw,
        value: 3,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'deck',
            },
          },
        ],
        timing: {
          type: 'once-per-turn',
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse evolution-based trainer search ability', async () => {
    const text =
      '自分の番に、このカードを手札から出して進化させたとき、自分の場に「テラスタル」のポケモンがいるなら、1回使える。自分の山札からトレーナーズを2枚まで選び、相手に見せて、手札に加える。そして山札を切る。';

    const expectedEffects = [
      {
        type: EffectType.Search,
        targets: [
          {
            type: 'trainer',
            player: 'self',
            count: 2,
            location: {
              type: 'deck',
              reveal: true,
            },
            filters: [
              {
                type: 'card-type',
                value: 'トレーナーズ',
              },
            ],
          },
        ],
        timing: {
          type: 'on-evolution',
        },
        conditions: [
          {
            type: 'card-count',
            target: {
              type: 'pokemon',
              player: 'self',
              location: {
                type: 'field',
              },
              filters: [
                {
                  type: 'card-type',
                  value: 'テラスタル',
                },
              ],
            },
          },
        ],
      },
      {
        type: EffectType.Shuffle,
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

  it('should parse Mew ex Restart ability', async () => {
    const text =
      '自分の番に1回使える。自分の手札が3枚になるように、山札を引く。';
    const expectedEffects = [
      {
        type: EffectType.Draw,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'deck',
            },
          },
        ],
        timing: {
          type: 'once-per-turn',
        },
        conditions: [
          {
            type: 'card-count',
            target: {
              type: 'pokemon',
              player: 'self',
              location: {
                type: 'hand',
              },
            },
            value: 3,
            comparison: 'equal',
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
