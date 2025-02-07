import { parseEffectText, EffectType } from '../effect-parser';

describe('Discard Draw Effects', () => {
  it('should parse discard then draw effect', async () => {
    const text = '自分の手札を1枚トラッシュする。その後、自分の山札を2枚引く。';

    const expectedEffects = [
      {
        type: EffectType.Discard,
        target: 'self',
        source: 'hand',
        count: 1,
        selection: 'choose',
      },
      {
        type: EffectType.Draw,
        target: 'self',
        count: 2,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
