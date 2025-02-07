import { parseEffectText, EffectType } from '../effect-parser';

describe('Damage Modifier Effects', () => {
  it('should parse ignore effects modifier', async () => {
    const text =
      'このワザのダメージは、相手のバトルポケモンにかかっている効果を計算しない。';

    const expectedEffects = [
      {
        type: EffectType.Damage,
        modifier: {
          type: 'ignore',
          what: 'effects',
          target: 'opponent',
          location: 'active',
        },
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
        target: 'opponent',
        location: 'active',
        modifier: {
          type: 'ignore',
          what: 'effects',
          target: 'opponent',
          location: 'active',
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
