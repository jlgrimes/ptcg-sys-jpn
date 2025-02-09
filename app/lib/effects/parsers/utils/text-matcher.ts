export class TextMatcher {
  static patterns = {
    numbers: {
      cardCount: /(\d+)枚/,
      pokemonCount: /(\d+)匹/,
      energyCount: /(\d+)個/,
      damageCount: /(\d+)ダメカン/,
      coinFlips: /(\d+)回コイン/,
    },
    timing: {
      oncePerTurn: ['自分の番に1回使える'],
      beforeYourTurn: ['自分の番の開始時'],
      afterYourTurn: ['自分の番の終了時'],
    },
    locations: {
      deck: ['山札'],
      hand: ['手札'],
      bench: ['ベンチ'],
      active: ['バトル場'],
      discard: ['トラッシュ'],
    },
    actions: {
      search: ['探す', '選び'],
      reveal: ['見せる', '公開する'],
      shuffle: ['切る'],
      draw: ['引く'],
      discard: ['トラッシュする', '捨てる'],
      place: ['出す', '置く'],
      attach: ['つける', '付ける'],
      damage: ['ダメージ', 'ダメカン'],
    },
    cardTypes: {
      basic: ['たね', '基本'],
      stage1: ['1進化'],
      stage2: ['2進化'],
      pokemonEx: ['ポケモンex'],
      trainer: ['トレーナーズ'],
      basicEnergy: ['基本エネルギー'],
    },
    targets: {
      self: ['自分の'],
      opponent: ['相手の'],
      both: ['お互いの'],
    },
    status: {
      asleep: ['ねむり'],
      confused: ['こんらん'],
      paralyzed: ['マヒ'],
      poisoned: ['どく'],
      burned: ['やけど'],
    },
    effects: {
      prevent: ['防ぐ', '防げる'],
      heal: ['回復', '治る'],
      switch: ['入れ替える', '交代'],
      evolve: ['進化'],
    },
  };

  constructor(private text: string) {}

  hasAll(...patterns: string[]): boolean {
    return patterns.every(pattern => this.text.includes(pattern));
  }

  hasAny(...patterns: string[]): boolean {
    return patterns.some(pattern => this.text.includes(pattern));
  }

  matchNumber(pattern: RegExp): string | null {
    const match = this.text.match(pattern);
    return match ? match[1] : null;
  }

  matchValue(pattern: RegExp): string | null {
    const match = this.text.match(pattern);
    return match ? match[1] : null;
  }
}
