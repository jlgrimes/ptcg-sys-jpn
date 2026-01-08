/**
 * CLI script to scrape Pokemon card data and store in database
 *
 * Usage:
 *   npx tsx scripts/scrape-card-data.ts --supported       # Use supported card range
 *   npx tsx scripts/scrape-card-data.ts --range 47000-47200
 *   npx tsx scripts/scrape-card-data.ts --ids 47001,47002,47003
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string (required)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import puppeteer, { Page } from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { SUPPORTED_CARDS, getSupportedCardIds } from '../app/lib/constants';

const BASE_URL = 'https://www.pokemon-card.com';

// Create PrismaClient lazily to ensure env vars are loaded
let prisma: PrismaClient;
let pool: Pool;

enum EnergyType {
  Normal = 'normal',
  Fighting = 'fighting',
  Fire = 'fire',
  Water = 'water',
  Lightning = 'lightning',
  Psychic = 'psychic',
  Grass = 'grass',
  Darkness = 'darkness',
  Metal = 'metal',
  Fairy = 'fairy',
  Dragon = 'dragon',
  Colorless = 'colorless',
}

interface Ability {
  name: string;
  description: string;
}

interface Move {
  name: string;
  damage: string;
  description: string;
  energyCount: number;
  energyTypes: EnergyType[];
}

interface ScrapedCardData {
  name: string;
  cardId: string;
  hp: string;
  type: string;
  cardEffect: string;
  abilities: Ability[];
  moves: Move[];
  weakness: string;
  resistance: string;
  retreatCost: string;
  evolution: string[];
  set: string;
  imageUrl: string;
}

// Browser-side scraping code as a string to avoid tsx/esbuild transformation issues
const SCRAPE_SCRIPT = `
  (() => {
    const cleanText = (text) => text?.replace(/\\s+/g, ' ').trim() || '';

    const notFound = document.querySelector('.error-message, .not-found');
    if (notFound) return null;

    const cardImage = document.querySelector('img[src*="card_images"]')?.getAttribute('src') || '';
    const name = cleanText(document.querySelector('h1')?.textContent);
    if (!name) return null;

    const cardId = cleanText(document.querySelector('.CardSet')?.textContent);
    const typeIcon = document.querySelector('.hp-type + .icon');
    const type = typeIcon?.className.match(/icon-(\\w+)/)?.[1] || 'colorless';
    const hp = cleanText(document.querySelector('.hp-num')?.textContent);

    let cardEffect = '';
    const effectHeader = Array.from(document.querySelectorAll('h2')).find(
      el => el.textContent?.trim() === 'グッズ'
    );
    if (effectHeader) {
      cardEffect = cleanText(effectHeader.nextElementSibling?.textContent);
    }

    const abilities = Array.from(document.querySelectorAll('h2'))
      .filter(el => el.textContent?.trim() === '特性')
      .flatMap(el => {
        const abilityName = cleanText(el.nextElementSibling?.textContent);
        const abilityDescription = cleanText(el.nextElementSibling?.nextElementSibling?.textContent);
        return abilityName ? [{ name: abilityName, description: abilityDescription || '' }] : [];
      });

    const moves = Array.from(document.querySelectorAll('h2'))
      .filter(el => el.textContent?.trim() === 'ワザ')
      .flatMap(el => {
        const moveElements = [];
        let currentEl = el.nextElementSibling;
        while (currentEl && currentEl.tagName !== 'H2') {
          moveElements.push(currentEl);
          currentEl = currentEl.nextElementSibling;
        }
        return moveElements.reduce((moves, el, index) => {
          if (el.tagName === 'H4') {
            const moveText = cleanText(el.textContent);
            const energyTypes = Array.from(el.querySelectorAll('.icon')).map(icon => {
              const typeMatch = icon.className.match(/icon-(\\w+)/);
              return typeMatch?.[1] === 'none' ? 'colorless' : (typeMatch?.[1] || 'colorless');
            });
            moves.push({
              name: cleanText(moveText.replace(/[×\\d]/g, '')),
              damage: moveText.match(/(\\d+)(?:×)?$/)?.[1] || '',
              description: cleanText(moveElements[index + 1]?.textContent) || '',
              energyCount: energyTypes.length,
              energyTypes,
            });
          }
          return moves;
        }, []);
      });

    const tds = Array.from(document.querySelectorAll('table td'));
    const weakness = cleanText(tds[0]?.textContent);
    const resistance = cleanText(tds[1]?.textContent);
    const retreatCost = cleanText(tds[2]?.textContent);

    const evolution = Array.from(document.querySelectorAll('h2'))
      .filter(el => el.textContent?.includes('進化'))
      .flatMap(el => Array.from(el.nextElementSibling?.querySelectorAll('div') || []))
      .map(div => cleanText(div.textContent));

    const set = cleanText(document.querySelector('.CardNumber')?.textContent);

    return { name, cardId, hp, type, cardEffect, abilities, moves, weakness, resistance, retreatCost, evolution, set, imageUrl: cardImage };
  })()
`;

async function scrapeCardData(page: Page, cardId: string): Promise<ScrapedCardData | null> {
  try {
    const url = `${BASE_URL}/card-search/details.php/card/${cardId}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const cardData = await page.evaluate(SCRAPE_SCRIPT);

    return cardData as ScrapedCardData | null;
  } catch (error) {
    console.error(`Error scraping card ${cardId}:`, error);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Check for database connection
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is required');
    console.error('');
    console.error('To set up Vercel Postgres:');
    console.error('  1. Go to https://vercel.com/dashboard');
    console.error('  2. Select your project → Storage → Create Database → Postgres');
    console.error('  3. Copy the DATABASE_URL to your .env.local file');
    console.error('  4. Run: npx prisma db push');
    process.exit(1);
  }

  let cardIds: string[] = [];
  let skipExisting = true;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--supported') {
      cardIds = getSupportedCardIds();
    } else if (args[i] === '--range' && args[i + 1]) {
      const [start, end] = args[i + 1].split('-').map(n => parseInt(n, 10));
      for (let id = start; id <= end; id++) {
        cardIds.push(String(id));
      }
      i++;
    } else if (args[i] === '--ids' && args[i + 1]) {
      cardIds = args[i + 1].split(',').map(id => id.trim());
      i++;
    } else if (args[i] === '--force') {
      skipExisting = false;
    }
  }

  if (cardIds.length === 0) {
    console.log('Usage:');
    console.log(`  npx tsx scripts/scrape-card-data.ts --supported              # Cards ${SUPPORTED_CARDS.START_ID}-${SUPPORTED_CARDS.END_ID}`);
    console.log('  npx tsx scripts/scrape-card-data.ts --range 47000-47200');
    console.log('  npx tsx scripts/scrape-card-data.ts --ids 47001,47002,47003');
    console.log('');
    console.log('Options:');
    console.log('  --force    Re-scrape cards that already exist in the database');
    process.exit(1);
  }

  console.log('Pokemon Card Data Scraper');
  console.log('=========================');
  console.log(`Cards to process: ${cardIds.length}`);
  console.log('');

  // Initialize Prisma client with PostgreSQL adapter (Prisma 7.x)
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });

  // Test database connection
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.error('');
    console.error('Make sure to run: npx prisma db push');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let processed = 0;
  let saved = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const cardId of cardIds) {
      processed++;

      // Skip if already exists
      if (skipExisting) {
        const existing = await prisma.card.findUnique({ where: { id: cardId } });
        if (existing) {
          skipped++;
          process.stdout.write(`\r[${processed}/${cardIds.length}] Skipped: ${skipped}, Saved: ${saved}, Failed: ${failed}`);
          continue;
        }
      }

      try {
        const cardData = await scrapeCardData(page, cardId);

        if (!cardData || !cardData.name) {
          failed++;
          process.stdout.write(`\r[${processed}/${cardIds.length}] Skipped: ${skipped}, Saved: ${saved}, Failed: ${failed}`);
          continue;
        }

        // Upsert card data (cast arrays to JSON-compatible format)
        const cardRecord = {
          name: cardData.name,
          hp: cardData.hp || null,
          type: cardData.type || null,
          cardEffect: cardData.cardEffect || null,
          abilities: JSON.parse(JSON.stringify(cardData.abilities)),
          moves: JSON.parse(JSON.stringify(cardData.moves)),
          weakness: cardData.weakness || null,
          resistance: cardData.resistance || null,
          retreatCost: cardData.retreatCost || null,
          evolution: JSON.parse(JSON.stringify(cardData.evolution)),
          setName: cardData.set || null,
          setCode: cardData.cardId || null,
          imageUrl: cardData.imageUrl || null,
        };

        await prisma.card.upsert({
          where: { id: cardId },
          update: cardRecord,
          create: { id: cardId, ...cardRecord },
        });

        saved++;
        process.stdout.write(`\r[${processed}/${cardIds.length}] Skipped: ${skipped}, Saved: ${saved}, Failed: ${failed}`);

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        console.error(`\nError processing card ${cardId}:`, error);
      }
    }

    console.log('\n');
    console.log('Done!');
    console.log(`  Processed: ${processed}`);
    console.log(`  Saved: ${saved}`);
    console.log(`  Skipped (existing): ${skipped}`);
    console.log(`  Failed: ${failed}`);

  } finally {
    await browser.close();
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
