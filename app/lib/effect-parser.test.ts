import { parseEffectText } from './effect-parser';
import { EffectType } from './effects/types';

describe('Effect Parser', () => {
  it('should parse bench damage effects with special conditions', async () => {
    const text =
      '相手のベンチポケモン1匹にも、30ダメージ。［ベンチは弱点・抵抗力を計算しない。］';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 30,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'bench',
            },
            count: 1,
          },
        ],
        modifiers: [
          {
            type: 'ignore',
            what: 'effects',
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse basic damage effect', async () => {
    const text = '20ダメージ';
    const expectedEffects = [
      {
        type: 'damage',
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            count: 1,
          },
        ],
        value: 20,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse conditional damage effects correctly', async () => {
    const text =
      '前の自分の番に、このポケモンが「じゅうまんガス」を使っていたなら、120ダメージ追加。';
    const effects = await parseEffectText(text);

    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({
      type: EffectType.Damage,
      value: 120,
      conditions: [
        {
          type: 'move-used',
          move: 'じゅうまんガス',
          timing: 'last-turn',
        },
      ],
    });
  });

  it('should parse conditional once-per-turn timing with discard and draw', async () => {
    const text =
      '自分の番に、自分の手札を1枚トラッシュするなら、1回使える。自分の山札を2枚引く。';
    const effects = await parseEffectText(text);

    expect(effects).toHaveLength(2);
    expect(effects[0]).toMatchObject({
      type: 'discard',
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
    });
    expect(effects[1]).toMatchObject({
      type: 'draw',
      value: 2,
      timing: {
        type: 'once-per-turn',
      },
    });
  });
});
