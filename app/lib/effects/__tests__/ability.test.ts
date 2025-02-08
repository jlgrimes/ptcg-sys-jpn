import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Ability Effects', () => {
  it('should parse once per turn search ability', async () => {
    const text =
      '特性「マッハサーチ」：1ターンに1回使える。山札から1枚選び、手札に加える。';
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
        timing: {
          type: 'once-per-turn',
          restriction: {
            type: 'ability-not-used',
            abilityName: 'マッハサーチ',
          },
        },
      },
      {
        type: EffectType.Search,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'deck',
            },
            count: 1,
          },
        ],
        timing: {
          type: 'once-per-turn',
          restriction: {
            type: 'ability-not-used',
            abilityName: 'マッハサーチ',
          },
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
        type: EffectType.Ability,
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
        timing: {
          type: 'once-per-turn',
          restriction: {
            type: 'ability-not-used',
            abilityName: 'さかてにとる',
          },
        },
      },
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
          restriction: {
            type: 'ability-not-used',
            abilityName: 'さかてにとる',
          },
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
