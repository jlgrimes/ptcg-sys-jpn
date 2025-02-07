import { parseEffectText, EffectType } from '../effect-parser';

describe('Ability Effects', () => {
  it('should parse once per turn search ability', async () => {
    const text =
      '自分の番に1回使える。自分の山札から好きなカードを1枚選び、手札に加える。そして山札を切る。この番、すでに別の「マッハサーチ」を使っていたなら、この特性は使えない。';

    const expectedEffects = [
      {
        type: EffectType.Search,
        target: 'self',
        source: 'deck',
        destination: 'hand',
        count: 1,
        selection: 'choose',
        timing: {
          type: 'once-per-turn',
          restriction: {
            type: 'ability-not-used',
            abilityName: 'マッハサーチ',
          },
        },
        shuffle: true,
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse ability immunity effect', async () => {
    const text = 'このポケモンは、相手のポケモンの特性の効果を受けない。';

    const expectedEffects = [
      {
        type: EffectType.Ability,
        effect: {
          type: 'immunity',
          what: 'ability',
          target: 'opponent',
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse coin flip damage prevention ability', async () => {
    const text =
      'このポケモンがバトルポケモンのとき、相手のワザのダメージを受けるたびに、コインを1回投げる。「おもて」なら、このポケモンはそのダメージを受けない。';

    const expectedEffects = [
      {
        type: EffectType.Ability,
        timing: {
          type: 'continuous',
          condition: 'active',
        },
        effect: {
          type: 'damage-prevention',
          coinFlips: 1,
          target: 'opponent',
          what: 'damage',
          onHeads: true,
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse ability nullification effect', async () => {
    const text =
      'このポケモンがバトルポケモンのとき、相手のバトルポケモンの特性は無効になる。';

    const expectedEffects = [
      {
        type: EffectType.Ability,
        timing: {
          type: 'continuous',
          condition: 'active',
        },
        effect: {
          type: 'nullify',
          what: 'ability',
          target: 'opponent',
          location: 'active',
        },
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
