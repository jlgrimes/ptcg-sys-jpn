import { parseEffectText, EffectType } from '../effect-parser';

describe('Energy Manipulation Effects', () => {
  it('should parse energy discard effect', async () => {
    const text =
      'このポケモンについているエネルギーを2個選び、トラッシュする。';

    const expectedEffects = [
      {
        type: EffectType.Energy,
        action: 'discard',
        target: 'self',
        source: 'active',
        count: 2,
        selection: 'choose',
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
