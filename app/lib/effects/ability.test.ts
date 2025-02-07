import { parseEffectText, EffectType } from '../effect-parser';

describe('Ability Effects', () => {
  it('should parse once per turn search ability', async () => {
    const text =
      '自分の番に1回使える。自分の山札から好きなカードを1枚選び、手札に加える。そして山札を切る。この番、すでに別の「マッハサーチ」を使っていたなら、この特性は使えない。';

    const expectedEffects = [
      {
        type: EffectType.Search,
        target: 'self',
        source: 'deck',
        destination: 'hand',
        count: 1,
        selection: 'choose',
        timing: {
          type: 'once-per-turn',
          restriction: {
            type: 'ability-not-used',
            abilityName: 'マッハサーチ',
          },
        },
        shuffle: true,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
