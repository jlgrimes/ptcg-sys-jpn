import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Condition Check Effects', () => {
  it('should parse prize card count condition', async () => {
    const text = '相手のサイドの残り枚数が4枚・3枚でないなら、このワザは失敗。';

    const expectedEffects = [
      {
        type: EffectType.Condition,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'prize',
            },
          },
        ],
        conditions: [
          {
            type: 'card-count',
            values: [4, 3],
            comparison: 'not-equal',
            onFailure: [
              {
                type: 'move-failure',
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
