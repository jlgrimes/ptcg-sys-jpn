import { CardScraper } from '../app/lib/coverage/card-scraper';
import { saveCards } from '../app/lib/coverage/corpus-store';

async function main() {
  console.log('Starting card scraper test...');

  const scraper = new CardScraper();
  await scraper.init();

  console.log('Scraper initialized, fetching card 47186...');

  try {
    const card = await scraper.scrapeCard(47186);

    if (card) {
      console.log('\n=== Card Found ===');
      console.log('Name:', card.name);
      console.log('ID:', card.id);
      console.log('HP:', card.hp);
      console.log('Type:', card.type);
      console.log('Set:', card.set);
      console.log('\nEffects:');
      for (const effect of card.effects) {
        console.log(`  [${effect.source}] ${effect.name || '(no name)'}`);
        console.log(`    Text: ${effect.text}`);
      }

      // Save to corpus
      saveCards([card]);
      console.log('\nCard saved to corpus.');
    } else {
      console.log('Card not found');
    }
  } catch (e) {
    console.error('Error fetching card:', e);
  }

  await scraper.close();
  console.log('\nDone.');
}

main();
