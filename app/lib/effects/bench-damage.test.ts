import { parseEffectText } from '../effect-parser';
import { EffectType } from './types';

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
});
