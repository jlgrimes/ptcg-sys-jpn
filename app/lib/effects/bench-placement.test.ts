import { parseEffectText, EffectType } from '../effect-parser';

describe('Bench Placement Effects', () => {
  it('should parse placing basic pokemon from deck', async () => {
    const text =
      '自分の山札からたねポケモンを1枚選び、ベンチに出す。そして山札を切る。';

    const expectedEffects = [
      {
        type: EffectType.Place,
        target: 'self',
        source: 'deck',
        destination: 'bench',
        count: 1,
        selection: 'choose',
        cardType: 'basic',
        shuffle: true,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse placing stage1 pokemon from hand', async () => {
    const text = '自分の手札から1進化ポケモンを2枚まで選び、ベンチに出す。';

    const expectedEffects = [
      {
        type: EffectType.Place,
        target: 'self',
        source: 'hand',
        destination: 'bench',
        count: 2,
        selection: 'choose',
        cardType: 'stage1',
        shuffle: false,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse placing stage2 pokemon from deck without choice', async () => {
    const text = '山札から2進化ポケモンを1枚ベンチに出す。その後、山札を切る。';

    const expectedEffects = [
      {
        type: EffectType.Place,
        target: 'self',
        source: 'deck',
        destination: 'bench',
        count: 1,
        selection: 'random',
        cardType: 'stage2',
        shuffle: true,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse placing opponent pokemon', async () => {
    const text =
      '相手の山札からたねポケモンを1枚選び、相手のベンチに出す。山札を切る。';

    const expectedEffects = [
      {
        type: EffectType.Place,
        target: 'opponent',
        source: 'deck',
        destination: 'bench',
        count: 1,
        selection: 'choose',
        cardType: 'basic',
        shuffle: true,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
