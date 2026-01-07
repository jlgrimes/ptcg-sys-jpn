/**
 * CLI script to scrape Pokemon card images and upload to Vercel Blob
 *
 * Usage:
 *   npx ts-node scripts/scrape-card-images.ts --range 47000-47200
 *   npx ts-node scripts/scrape-card-images.ts --from-corpus
 *   npx ts-node scripts/scrape-card-images.ts --ids 47001,47002,47003
 *
 * Environment:
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob token (required)
 */

import puppeteer, { Browser } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { put } from '@vercel/blob';

const BASE_URL = 'https://www.pokemon-card.com';
const DATA_DIR = path.join(process.cwd(), 'data');
const CARDS_DIR = path.join(DATA_DIR, 'cards');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const IMAGE_MAP_PATH = path.join(IMAGES_DIR, 'image-map.json');

interface ImageMapEntry {
  cardId: string;
  blobUrl: string;
  originalUrl: string;
  uploadedAt: string;
}

interface ImageMap {
  [cardId: string]: ImageMapEntry;
}

function ensureImageDir(): void {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

function loadImageMap(): ImageMap {
  ensureImageDir();
  if (!fs.existsSync(IMAGE_MAP_PATH)) {
    return {};
  }
  const content = fs.readFileSync(IMAGE_MAP_PATH, 'utf-8');
  return JSON.parse(content) as ImageMap;
}

function saveImageMap(map: ImageMap): void {
  ensureImageDir();
  fs.writeFileSync(IMAGE_MAP_PATH, JSON.stringify(map, null, 2));
}

async function scrapeImageUrl(browser: Browser, cardId: string): Promise<string | null> {
  const page = await browser.newPage();
  try {
    const url = `${BASE_URL}/card-search/details.php/card/${cardId}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const imageUrl = await page.evaluate(() => {
      const img = document.querySelector('img[src*="card_images"]') as HTMLImageElement;
      return img?.src || null;
    });

    return imageUrl;
  } catch (error) {
    console.error(`Error scraping card ${cardId}:`, error);
    return null;
  } finally {
    await page.close();
  }
}

async function downloadImage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToBlob(cardId: string, imageBuffer: Buffer): Promise<string> {
  const blob = await put(`card-images/${cardId}.png`, imageBuffer, {
    access: 'public',
    contentType: 'image/png',
  });
  return blob.url;
}

function getCardIdsFromCorpus(): string[] {
  if (!fs.existsSync(CARDS_DIR)) {
    return [];
  }
  const files = fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => f.replace('.json', ''));
}

async function main() {
  const args = process.argv.slice(2);

  // Check for blob token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Error: BLOB_READ_WRITE_TOKEN environment variable is required');
    console.error('Get your token from: https://vercel.com/dashboard/stores');
    process.exit(1);
  }

  let cardIds: string[] = [];
  let skipExisting = true;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--range' && args[i + 1]) {
      const [start, end] = args[i + 1].split('-').map(n => parseInt(n, 10));
      for (let id = start; id <= end; id++) {
        cardIds.push(String(id));
      }
      i++;
    } else if (args[i] === '--from-corpus') {
      cardIds = getCardIdsFromCorpus();
    } else if (args[i] === '--ids' && args[i + 1]) {
      cardIds = args[i + 1].split(',').map(id => id.trim());
      i++;
    } else if (args[i] === '--force') {
      skipExisting = false;
    }
  }

  if (cardIds.length === 0) {
    console.log('Usage:');
    console.log('  npx ts-node scripts/scrape-card-images.ts --range 47000-47200');
    console.log('  npx ts-node scripts/scrape-card-images.ts --from-corpus');
    console.log('  npx ts-node scripts/scrape-card-images.ts --ids 47001,47002,47003');
    console.log('');
    console.log('Options:');
    console.log('  --force    Re-upload images that already exist in the map');
    process.exit(1);
  }

  console.log('Pokemon Card Image Scraper');
  console.log('==========================');
  console.log(`Cards to process: ${cardIds.length}`);
  console.log('');

  const imageMap = loadImageMap();
  const browser = await puppeteer.launch({ headless: true });

  let processed = 0;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const cardId of cardIds) {
      processed++;

      // Skip if already exists
      if (skipExisting && imageMap[cardId]) {
        skipped++;
        process.stdout.write(`\r[${processed}/${cardIds.length}] Skipped: ${skipped}, Uploaded: ${uploaded}, Failed: ${failed}`);
        continue;
      }

      try {
        // Scrape image URL from pokemon-card.com
        const originalUrl = await scrapeImageUrl(browser, cardId);
        if (!originalUrl) {
          failed++;
          process.stdout.write(`\r[${processed}/${cardIds.length}] Skipped: ${skipped}, Uploaded: ${uploaded}, Failed: ${failed}`);
          continue;
        }

        // Download the image
        const imageBuffer = await downloadImage(originalUrl);

        // Upload to Vercel Blob
        const blobUrl = await uploadToBlob(cardId, imageBuffer);

        // Save to map
        imageMap[cardId] = {
          cardId,
          blobUrl,
          originalUrl,
          uploadedAt: new Date().toISOString(),
        };

        // Save map periodically (every 10 uploads)
        if (uploaded % 10 === 0) {
          saveImageMap(imageMap);
        }

        uploaded++;
        process.stdout.write(`\r[${processed}/${cardIds.length}] Skipped: ${skipped}, Uploaded: ${uploaded}, Failed: ${failed}`);

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failed++;
        console.error(`\nError processing card ${cardId}:`, error);
      }
    }

    // Final save
    saveImageMap(imageMap);

    console.log('\n');
    console.log('Done!');
    console.log(`  Processed: ${processed}`);
    console.log(`  Uploaded: ${uploaded}`);
    console.log(`  Skipped (existing): ${skipped}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Image map saved to: ${IMAGE_MAP_PATH}`);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
