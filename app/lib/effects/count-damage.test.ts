import { parseEffectText, EffectType } from '../effect-parser';

describe('Count-based Damage Effects', () => {
  it('should parse damage based on Pokemon count', async () => {
    const text = '相手の場の「ポケモンex」の数×60ダメージ。';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 60,
        target: 'opponent',
        location: 'active',
        multiplier: {
          type: 'count',
          target: 'opponent',
          condition: 'ポケモンex',
          location: 'field',
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
