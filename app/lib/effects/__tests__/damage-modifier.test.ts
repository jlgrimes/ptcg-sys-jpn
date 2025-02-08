import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Damage Modifier Effects', () => {
  it('should parse ignore effects modifier', async () => {
    const text =
      'このワザのダメージは、相手のバトルポケモンにかかっている効果を計算しない。';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'active',
            },
          },
        ],
        modifiers: [
          {
            type: 'ignore',
            what: 'effects',
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse damage with effect ignore', async () => {
    const text =
      '120ダメージ。このワザのダメージは、相手のバトルポケモンにかかっている効果を計算しない。';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        value: 120,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: {
              type: 'active',
            },
          },
        ],
        modifiers: [
          {
            type: 'ignore',
            what: 'effects',
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
