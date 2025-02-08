import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Move Restriction Effects', () => {
  it('should parse move restriction effect', async () => {
    const text = '次の相手の番、このポケモンは「アイアンテール」を使えない';
    const expectedEffects = [
      {
        type: EffectType.Restriction,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: {
              type: 'active',
            },
          },
        ],
        conditions: [
          {
            type: 'move-restriction',
            moveName: 'アイアンテール',
            restriction: 'cannot-use',
            duration: 'next-turn',
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
