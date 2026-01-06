/**
 * CLI script to scrape Pokemon cards from pokemon-card.com
 *
 * Usage:
 *   npx ts-node scripts/scrape-cards.ts --start 1 --end 100
 *   npx ts-node scripts/scrape-cards.ts --range 47000-48000
 *   npx ts-node scripts/scrape-cards.ts --sample 100
 */

import { CardScraper } from '../app/lib/coverage/card-scraper';
import { saveCards, getCorpusStats, ensureDataDirs } from '../app/lib/coverage/corpus-store';
import { CardCorpusEntry } from '../app/lib/coverage/types';

async function main() {
  const args = process.argv.slice(2);

  let startId = 1;
  let endId = 100;
  let sampleMode = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start' && args[i + 1]) {
      startId = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--end' && args[i + 1]) {
      endId = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--range' && args[i + 1]) {
      const [start, end] = args[i + 1].split('-').map(n => parseInt(n, 10));
      startId = start;
      endId = end;
      i++;
    } else if (args[i] === '--sample' && args[i + 1]) {
      sampleMode = true;
      endId = parseInt(args[i + 1], 10);
      i++;
    }
  }

  console.log('Pokemon Card Scraper');
  console.log('====================');
  console.log(`Range: ${startId} - ${endId}`);
  console.log('');

  ensureDataDirs();

  const scraper = new CardScraper();

  try {
    await scraper.init();

    let cardsScraped = 0;
    let effectsFound = 0;

    const cards = await scraper.scrapeRange({
      startId,
      endId,
      batchSize: 3, // Conservative to avoid rate limiting
      delayMs: 1000,
      onProgress: (current, total, card) => {
        if (card) {
          cardsScraped++;
          effectsFound += card.effects.length;
          process.stdout.write(
            `\r[${current}/${total}] Scraped: ${cardsScraped} cards, ${effectsFound} effects - ${card.name || 'N/A'}`
          );
        } else {
          process.stdout.write(`\r[${current}/${total}] Card not found`);
        }
      },
      onError: (id, error) => {
        console.error(`\nError scraping card ${id}: ${error.message}`);
      },
    });

    console.log('\n');
    console.log(`Scraping complete!`);
    console.log(`Cards found: ${cards.length}`);
    console.log(`Total effects: ${cards.reduce((sum, c) => sum + c.effects.length, 0)}`);

    // Save to corpus
    console.log('\nSaving to corpus...');
    saveCards(cards);

    // Show corpus stats
    const stats = getCorpusStats();
    console.log('\nCorpus Statistics:');
    console.log(`  Total cards: ${stats.totalCards}`);
    console.log(`  Total effects: ${stats.totalEffects}`);
    console.log(`  Last updated: ${stats.lastUpdated}`);

  } finally {
    await scraper.close();
  }
}

main().catch(console.error);
