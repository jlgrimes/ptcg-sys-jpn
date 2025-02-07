import { parseEffectText, EffectType } from '../effect-parser';

describe('Status Effects', () => {
  it('should parse coin flip status effect with damage', async () => {
    const text =
      '60ダメージ。コインを1回投げ、「おもて」なら、相手のバトルポケモンをマヒ状態にする。';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 60,
        target: 'opponent',
        location: 'active',
        coinFlip: {
          count: 1,
          onHeads: {
            type: EffectType.Status,
            status: 'paralyzed',
            target: 'opponent',
            location: 'active',
          },
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
