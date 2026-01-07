import { CardScraper } from '../card-scraper';
import { parseEffectText } from '../../effect-parser';

interface FailedEffect {
  cardId: string;
  cardName: string;
  source: string;
  text: string;
  patterns: string[];
}

// Pattern detection for categorizing failures
const PATTERN_DETECTORS: Array<{ name: string; test: (text: string) => boolean }> = [
  { name: 'retreat-block', test: (t) => t.includes('にげられない') },
  { name: 'confusion', test: (t) => t.includes('こんらん') },
  { name: 'poison', test: (t) => t.includes('どく') },
  { name: 'burn', test: (t) => t.includes('やけど') },
  { name: 'sleep', test: (t) => t.includes('ねむり') },
  { name: 'paralysis', test: (t) => t.includes('マヒ') },
  { name: 'heal', test: (t) => t.includes('回復') || (t.includes('ダメカン') && t.includes('取る')) },
  { name: 'deck-look', test: (t) => t.includes('山札') && t.includes('見る') },
  { name: 'deck-top', test: (t) => t.includes('山札の上') },
  { name: 'hand-reveal', test: (t) => t.includes('手札') && t.includes('見') },
  { name: 'prize', test: (t) => t.includes('サイド') },
  { name: 'retreat-cost', test: (t) => t.includes('にげる') && !t.includes('にげられない') },
  { name: 'gx-attack', test: (t) => t.includes('GXワザ') },
  { name: 'vstar-power', test: (t) => t.includes('VSTARパワー') },
  { name: 'ability-block', test: (t) => t.includes('特性') && (t.includes('なくなる') || t.includes('使えない')) },
  { name: 'trainer-block', test: (t) => (t.includes('グッズ') || t.includes('サポート')) && t.includes('使えない') },
  { name: 'choice', test: (t) => t.includes('選び') || t.includes('選ぶ') || t.includes('選んで') },
  { name: 'coin-flip', test: (t) => t.includes('コイン') },
  { name: 'devolution', test: (t) => t.includes('退化') },
  { name: 'evolution-skip', test: (t) => t.includes('進化') && t.includes('できる') },
  { name: 'move-copy', test: (t) => t.includes('ワザ') && t.includes('使う') && t.includes('として') },
  { name: 'bench-damage', test: (t) => t.includes('ベンチ') && t.includes('ダメージ') },
  { name: 'self-damage', test: (t) => t.includes('自分') && t.includes('ダメージ') && t.includes('にも') },
  { name: 'prevention', test: (t) => t.includes('受けない') || t.includes('防ぐ') },
  { name: 'type-change', test: (t) => t.includes('タイプ') && t.includes('変わる') },
];

function detectPatterns(text: string): string[] {
  return PATTERN_DETECTORS
    .filter(p => p.test(text))
    .map(p => p.name);
}

describe('Extensive Coverage Analysis', () => {
  let scraper: CardScraper;

  beforeAll(async () => {
    scraper = new CardScraper();
    await scraper.init();
  }, 30000);

  afterAll(async () => {
    await scraper.close();
  });

  it('should analyze coverage across 50 cards', async () => {
    const startId = 47100;
    const endId = 47150;

    const failed: FailedEffect[] = [];
    const passed: Array<{ cardName: string; text: string; effectCount: number }> = [];
    let totalEffects = 0;
    let cardsFound = 0;

    for (let id = startId; id <= endId; id++) {
      try {
        const card = await scraper.scrapeCard(id);
        if (!card || card.effects.length === 0) continue;

        cardsFound++;

        for (const effect of card.effects) {
          totalEffects++;
          const parsed = await parseEffectText(effect.text);

          if (parsed.length > 0) {
            passed.push({
              cardName: card.name,
              text: effect.text,
              effectCount: parsed.length,
            });
          } else {
            failed.push({
              cardId: card.id,
              cardName: card.name,
              source: effect.source,
              text: effect.text,
              patterns: detectPatterns(effect.text),
            });
          }
        }
      } catch (e) {
        // Skip failed scrapes
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('COVERAGE ANALYSIS REPORT');
    console.log('='.repeat(60));
    console.log(`Cards found: ${cardsFound}`);
    console.log(`Total effects: ${totalEffects}`);
    console.log(`Parsed: ${passed.length} (${((passed.length / totalEffects) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed.length} (${((failed.length / totalEffects) * 100).toFixed(1)}%)`);

    // Pattern analysis
    const patternCounts: Record<string, number> = {};
    for (const f of failed) {
      for (const p of f.patterns) {
        patternCounts[p] = (patternCounts[p] || 0) + 1;
      }
      if (f.patterns.length === 0) {
        patternCounts['unknown'] = (patternCounts['unknown'] || 0) + 1;
      }
    }

    console.log('\n' + '-'.repeat(60));
    console.log('FAILED PATTERNS (sorted by frequency)');
    console.log('-'.repeat(60));
    const sortedPatterns = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1]);
    for (const [pattern, count] of sortedPatterns) {
      console.log(`  ${pattern}: ${count}`);
    }

    console.log('\n' + '-'.repeat(60));
    console.log('FAILED EFFECTS (with detected patterns)');
    console.log('-'.repeat(60));
    for (const f of failed) {
      console.log(`\n[${f.cardName}] (${f.source})`);
      console.log(`  Text: ${f.text.slice(0, 80)}${f.text.length > 80 ? '...' : ''}`);
      console.log(`  Patterns: ${f.patterns.length > 0 ? f.patterns.join(', ') : 'unknown'}`);
    }

    // Expect decent coverage
    expect(passed.length / totalEffects).toBeGreaterThan(0.5);
  }, 300000); // 5 minute timeout for scraping
});

describe('Quick Parser Tests on Failing Patterns', () => {
  // Test specific patterns that commonly fail

  it('should parse confusion status', async () => {
    const text = '相手のバトルポケモンをこんらんにする。';
    const effects = await parseEffectText(text);
    console.log('Confusion result:', JSON.stringify(effects, null, 2));
  }, 10000);

  it('should parse retreat block', async () => {
    const text = '次の相手の番、このワザを受けたポケモンは、にげられない。';
    const effects = await parseEffectText(text);
    console.log('Retreat block result:', JSON.stringify(effects, null, 2));
  }, 10000);

  it('should parse heal effect', async () => {
    const text = 'このポケモンのHPを30回復。';
    const effects = await parseEffectText(text);
    console.log('Heal result:', JSON.stringify(effects, null, 2));
  }, 10000);

  it('should parse poison', async () => {
    const text = '相手のバトルポケモンをどくにする。';
    const effects = await parseEffectText(text);
    console.log('Poison result:', JSON.stringify(effects, null, 2));
  }, 10000);

  it('should parse Eevee ex special evolution', async () => {
    const text = 'このポケモンは、「イーブイ」から進化する「ポケモンex」を手札から出して、このポケモンにのせて進化できる。（最初の自分の番や、出したばかりの番には進化できない。）';
    const effects = await parseEffectText(text);
    console.log('Eevee ex special evolution result:', JSON.stringify(effects, null, 2));
    expect(effects.length).toBeGreaterThan(0);
  }, 10000);
});
