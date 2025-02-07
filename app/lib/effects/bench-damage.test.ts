import { parseEffectText, EffectType } from '../effect-parser';

describe('Bench Damage Effects', () => {
  it('should parse single bench pokemon damage', async () => {
    const text =
      '相手のベンチポケモン1匹にも、30ダメージ。［ベンチは弱点・抵抗力を計算しない。］';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 30,
        target: 'opponent',
        location: 'bench',
        count: 1,
        ignoreWeaknessResistance: true,
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
        target: 'opponent',
        location: 'bench',
        count: 'all',
        ignoreWeaknessResistance: true,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
