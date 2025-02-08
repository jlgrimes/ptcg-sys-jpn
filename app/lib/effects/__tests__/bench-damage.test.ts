import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Bench Damage Effects', () => {
  it('should parse single bench pokemon damage', async () => {
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

  it('should parse all bench pokemon damage', async () => {
    const text =
      '相手のベンチポケモン全員に、それぞれ50ダメージ。［ベンチは弱点・抵抗力を計算しない。］';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 50,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'bench',
            },
            count: 'all',
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

  it('should parse bench damage effect', async () => {
    const text = 'ベンチのポケモンに20ダメージ';
    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 20,
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
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse bench damage with specific target', async () => {
    const text =
      '相手のポケモン1匹に、100ダメージ。［ベンチは弱点・抵抗力を計算しない。］';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 100,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
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
});
