import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Status Effects', () => {
  it('should parse paralysis effect', async () => {
    const text = 'コインを投げて「おもて」なら、相手のポケモンをマヒ状態にする';
    const expectedEffects = [
      {
        type: EffectType.Status,
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
