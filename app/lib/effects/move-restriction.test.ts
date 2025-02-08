import { parseEffectText } from '../effect-parser';
import { EffectType } from './types';

describe('Move Restriction Effects', () => {
  it('should parse move restriction for next turn', async () => {
    const text =
      '次の自分の番、このポケモンは「ブレイブスラッシュ」が使えない。';

    const expectedEffects = [
      {
        type: EffectType.Restriction,
        target: 'self',
        moveName: 'ブレイブスラッシュ',
        duration: 'next-turn',
        restriction: 'cannot-use',
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
