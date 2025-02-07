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

  it('should parse energy attach from discard effect', async () => {
    const text =
      '自分のトラッシュから基本エネルギーを2枚まで選び、ベンチポケモン1匹につける。';

    const expectedEffects = [
      {
        type: EffectType.Energy,
        action: 'attach',
        target: 'self',
        source: 'discard',
        destination: 'bench',
        count: 2,
        selection: 'choose',
        energyType: 'basic',
        maxCount: true,
        targetCount: 1,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
