import { parseEffectText, EffectType } from '../effect-parser';

describe('Condition Check Effects', () => {
  it('should parse prize card count condition', async () => {
    const text = '相手のサイドの残り枚数が4枚・3枚でないなら、このワザは失敗。';

    const expectedEffects = [
      {
        type: EffectType.Condition,
        result: 'fail',
        check: {
          type: 'prize-count',
          target: 'opponent',
          values: [4, 3],
          comparison: 'not-equal',
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
