import { parseEffectText } from '../effect-parser';
import { EffectType } from './types';

describe('Status Effects', () => {
  it('should parse coin flip status effect with damage', async () => {
    const text =
      '60ダメージ。コインを1回投げ、「おもて」なら、相手のバトルポケモンをマヒ状態にする。';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 60,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'active',
            },
          },
        ],
        conditions: [
          {
            type: 'coin-flip',
            value: 1,
            onSuccess: [
              {
                type: EffectType.Status,
                status: 'paralyzed',
              },
            ],
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
