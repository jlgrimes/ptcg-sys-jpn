import { parseEffectText, EffectType } from './effect-parser';

describe('Effect Parser', () => {
  it('should parse bench damage effects with special conditions', async () => {
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
});
