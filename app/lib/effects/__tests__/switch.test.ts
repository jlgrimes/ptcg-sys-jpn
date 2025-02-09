import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Switch Effects', () => {
  it('should parse opponent bench to active switch effect', async () => {
    const text = '相手のベンチポケモンを1匹選び、バトルポケモンと入れ替える。';
    const expectedEffects = [
      {
        type: EffectType.Switch,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: { type: 'bench' },
            count: 1,
          },
          {
            type: 'pokemon',
            player: 'opponent',
            location: { type: 'active' },
            count: 1,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse self active to bench switch effect', async () => {
    const text = '自分のバトルポケモンをベンチポケモンと入れ替える。';
    const expectedEffects = [
      {
        type: EffectType.Switch,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: { type: 'active' },
            count: 1,
          },
          {
            type: 'pokemon',
            player: 'self',
            location: { type: 'bench' },
            count: 1,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse both switch effects in sequence', async () => {
    const text =
      '相手のベンチポケモンを1匹選び、バトルポケモンと入れ替える。その後、自分のバトルポケモンをベンチポケモンと入れ替える。';
    const expectedEffects = [
      {
        type: EffectType.Switch,
        targets: [
          {
            type: 'pokemon',
            player: 'opponent',
            location: { type: 'bench' },
            count: 1,
          },
          {
            type: 'pokemon',
            player: 'opponent',
            location: { type: 'active' },
            count: 1,
          },
        ],
      },
      {
        type: EffectType.Switch,
        targets: [
          {
            type: 'pokemon',
            player: 'self',
            location: { type: 'active' },
            count: 1,
          },
          {
            type: 'pokemon',
            player: 'self',
            location: { type: 'bench' },
            count: 1,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
