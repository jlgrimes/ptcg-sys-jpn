import { CardScraper } from '../card-scraper';
import { CoverageTracker } from '../coverage-tracker';
import { parseEffectText } from '../../effect-parser';

describe('Card Scraper', () => {
  let scraper: CardScraper;

  beforeAll(async () => {
    scraper = new CardScraper();
    await scraper.init();
  }, 30000);

  afterAll(async () => {
    await scraper.close();
  });

  it('should scrape a single card', async () => {
    const card = await scraper.scrapeCard(47186);

    expect(card).not.toBeNull();
    if (card) {
      console.log('\n=== Card ===');
      console.log('Name:', card.name);
      console.log('ID:', card.id);
      console.log('Type:', card.type);
      console.log('HP:', card.hp);
      console.log('Effects:', card.effects.length);

      for (const effect of card.effects) {
        console.log(`\n[${effect.source}] ${effect.name || ''}`);
        console.log('Text:', effect.text);
      }
    }
  }, 60000);
});

describe('Real Card Coverage', () => {
  let scraper: CardScraper;

  beforeAll(async () => {
    scraper = new CardScraper();
    await scraper.init();
  }, 30000);

  afterAll(async () => {
    await scraper.close();
  });

  // Test parsing of various real cards
  const testCardIds = [
    47186, // Some recent card
    47060,
    47061,
    47062,
    47063,
    47064,
    47065,
  ];

  it('should parse effects from real cards', async () => {
    const tracker = new CoverageTracker();
    const results: Array<{
      cardName: string;
      effectText: string;
      parsed: boolean;
      effectCount: number;
    }> = [];

    for (const cardId of testCardIds) {
      try {
        const card = await scraper.scrapeCard(cardId);
        if (!card) continue;

        for (const effect of card.effects) {
          const parsed = await parseEffectText(effect.text);
          results.push({
            cardName: card.name,
            effectText: effect.text.slice(0, 50) + '...',
            parsed: parsed.length > 0,
            effectCount: parsed.length,
          });
        }
      } catch (e) {
        console.error(`Error with card ${cardId}:`, e);
      }
    }

    // Print summary
    console.log('\n=== Coverage Summary ===');
    const passed = results.filter(r => r.parsed).length;
    const failed = results.filter(r => !r.parsed).length;
    console.log(`Parsed: ${passed}/${results.length} (${((passed / results.length) * 100).toFixed(1)}%)`);

    console.log('\n=== Failed Effects ===');
    for (const r of results.filter(r => !r.parsed)) {
      console.log(`[${r.cardName}] ${r.effectText}`);
    }

    console.log('\n=== Successful Effects ===');
    for (const r of results.filter(r => r.parsed)) {
      console.log(`[${r.cardName}] ${r.effectText} -> ${r.effectCount} effects`);
    }
  }, 120000);
});
