import { parseEffectText } from '../../effect-parser';
import { EffectType } from '../types';

describe('Hand to Deck Effects', () => {
  it('should parse both players putting hands at bottom of deck and drawing based on prize count', async () => {
    const text =
      'おたがいのプレイヤーは、それぞれ自分の手札をすべてウラにして切り、山札の下にもどす。その後、それぞれ自分のサイドの残り枚数ぶん、山札を引く。';
    const expectedEffects = [
      {
        type: EffectType.Place,
        targets: [
          {
            type: 'card',
            player: 'self',
            location: { type: 'hand' },
            count: 'all',
          },
          {
            type: 'card',
            player: 'self',
            location: { type: 'deck' },
            count: 'all',
          },
        ],
        modifiers: [
          {
            type: 'add',
            what: 'effects',
            value: 0,
          },
        ],
      },
      {
        type: EffectType.Place,
        targets: [
          {
            type: 'card',
            player: 'opponent',
            location: { type: 'hand' },
            count: 'all',
          },
          {
            type: 'card',
            player: 'opponent',
            location: { type: 'deck' },
            count: 'all',
          },
        ],
        modifiers: [
          {
            type: 'add',
            what: 'effects',
            value: 0,
          },
        ],
      },
      {
        type: EffectType.Draw,
        targets: [
          {
            type: 'card',
            player: 'self',
            location: { type: 'deck' },
          },
        ],
        conditions: [
          {
            type: 'card-count',
            target: {
              type: 'card',
              player: 'self',
              location: { type: 'prize' },
            },
            comparison: 'equal',
          },
        ],
      },
      {
        type: EffectType.Draw,
        targets: [
          {
            type: 'card',
            player: 'opponent',
            location: { type: 'deck' },
          },
        ],
        conditions: [
          {
            type: 'card-count',
            target: {
              type: 'card',
              player: 'opponent',
              location: { type: 'prize' },
            },
            comparison: 'equal',
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse single player putting hand at bottom of deck', async () => {
    const text = '自分の手札をすべてウラにして切り、山札の下にもどす。';
    const expectedEffects = [
      {
        type: EffectType.Place,
        targets: [
          {
            type: 'card',
            player: 'self',
            location: { type: 'hand' },
            count: 'all',
          },
          {
            type: 'card',
            player: 'self',
            location: { type: 'deck' },
            count: 'all',
          },
        ],
        modifiers: [
          {
            type: 'add',
            what: 'effects',
            value: 0,
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });

  it('should parse both players shuffling hands into deck and drawing specific cards', async () => {
    const text =
      'おたがいのプレイヤーは、それぞれ手札をすべて山札にもどして切る。その後、それぞれ山札を4枚引く。';
    const expectedEffects = [
      {
        type: EffectType.Shuffle,
        targets: [
          {
            type: 'card',
            player: 'self',
            location: { type: 'hand' },
            count: 'all',
          },
          {
            type: 'card',
            player: 'self',
            location: { type: 'deck' },
          },
        ],
      },
      {
        type: EffectType.Shuffle,
        targets: [
          {
            type: 'card',
            player: 'opponent',
            location: { type: 'hand' },
            count: 'all',
          },
          {
            type: 'card',
            player: 'opponent',
            location: { type: 'deck' },
          },
        ],
      },
      {
        type: EffectType.Draw,
        value: 4,
        targets: [
          {
            type: 'card',
            player: 'self',
            location: { type: 'deck' },
          },
        ],
      },
      {
        type: EffectType.Draw,
        value: 4,
        targets: [
          {
            type: 'card',
            player: 'opponent',
            location: { type: 'deck' },
          },
        ],
      },
    ];

    const effects = await parseEffectText(text);
    expect(effects).toEqual(expectedEffects);
  });
});
