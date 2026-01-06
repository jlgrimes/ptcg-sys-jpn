import puppeteer, { Browser, Page } from 'puppeteer';
import { CardCorpusEntry, EffectText } from './types';

const BASE_URL = 'https://www.pokemon-card.com';

export interface ScrapeOptions {
  startId?: number;
  endId?: number;
  batchSize?: number;
  delayMs?: number;
  onProgress?: (current: number, total: number, card: CardCorpusEntry | null) => void;
  onError?: (id: number, error: Error) => void;
}

export class CardScraper {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape a single card by ID
   */
  async scrapeCard(cardId: number): Promise<CardCorpusEntry | null> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const page = await this.browser.newPage();
    try {
      const url = `${BASE_URL}/card-search/details.php/card/${cardId}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const card = await page.evaluate((id: number) => {
        const cleanText = (text: string | null | undefined): string =>
          text?.replace(/\s+/g, ' ').trim() || '';

        // Check if card exists (404 pages have specific markers)
        const errorElement = document.querySelector('.error-page, .not-found');
        if (errorElement) return null;

        const name = cleanText(document.querySelector('h1')?.textContent);
        if (!name) return null; // Card doesn't exist

        const cardIdText = cleanText(document.querySelector('.CardSet')?.textContent);
        const hp = cleanText(document.querySelector('.hp-num')?.textContent);

        const typeIcon = document.querySelector('.hp-type + .icon');
        const type = typeIcon?.className.match(/icon-(\w+)/)?.[1] || '';

        const set = cleanText(document.querySelector('.CardNumber')?.textContent);

        const effects: Array<{
          source: 'ability' | 'move' | 'card-effect';
          name?: string;
          text: string;
          damage?: string;
        }> = [];

        // Card effect (for trainers, energies)
        const effectHeaders = Array.from(document.querySelectorAll('h2'));
        const trainerHeader = effectHeaders.find(
          el => el.textContent?.trim() === 'グッズ' ||
                el.textContent?.trim() === 'サポート' ||
                el.textContent?.trim() === 'スタジアム' ||
                el.textContent?.trim() === 'ポケモンのどうぐ'
        );
        if (trainerHeader) {
          const effectText = cleanText(trainerHeader.nextElementSibling?.textContent);
          if (effectText) {
            effects.push({
              source: 'card-effect',
              text: effectText,
            });
          }
        }

        // Special energy effects
        const energyHeader = effectHeaders.find(
          el => el.textContent?.includes('エネルギー') && el.tagName === 'H2'
        );
        if (energyHeader) {
          const effectText = cleanText(energyHeader.nextElementSibling?.textContent);
          if (effectText) {
            effects.push({
              source: 'card-effect',
              text: effectText,
            });
          }
        }

        // Abilities (特性)
        const abilityHeaders = effectHeaders.filter(
          el => el.textContent?.trim() === '特性'
        );
        for (const header of abilityHeaders) {
          const abilityName = cleanText(header.nextElementSibling?.textContent);
          const abilityDesc = cleanText(
            header.nextElementSibling?.nextElementSibling?.textContent
          );
          if (abilityDesc) {
            effects.push({
              source: 'ability',
              name: abilityName,
              text: abilityDesc,
            });
          }
        }

        // Pokemon Powers (ポケパワー) - Legacy
        const pokePowerHeaders = effectHeaders.filter(
          el => el.textContent?.trim() === 'ポケパワー'
        );
        for (const header of pokePowerHeaders) {
          const powerName = cleanText(header.nextElementSibling?.textContent);
          const powerDesc = cleanText(
            header.nextElementSibling?.nextElementSibling?.textContent
          );
          if (powerDesc) {
            effects.push({
              source: 'ability',
              name: powerName,
              text: powerDesc,
            });
          }
        }

        // Poke-Bodies (ポケボディー) - Legacy
        const pokeBodyHeaders = effectHeaders.filter(
          el => el.textContent?.trim() === 'ポケボディー'
        );
        for (const header of pokeBodyHeaders) {
          const bodyName = cleanText(header.nextElementSibling?.textContent);
          const bodyDesc = cleanText(
            header.nextElementSibling?.nextElementSibling?.textContent
          );
          if (bodyDesc) {
            effects.push({
              source: 'ability',
              name: bodyName,
              text: bodyDesc,
            });
          }
        }

        // Moves (ワザ)
        const moveHeaders = effectHeaders.filter(
          el => el.textContent?.trim() === 'ワザ'
        );
        for (const header of moveHeaders) {
          const moveElements: Element[] = [];
          let currentEl = header.nextElementSibling;

          while (currentEl && currentEl.tagName !== 'H2') {
            moveElements.push(currentEl);
            currentEl = currentEl.nextElementSibling;
          }

          // Process moves in pairs of h4 (move name) and p (description)
          for (let i = 0; i < moveElements.length; i++) {
            const el = moveElements[i];
            if (el.tagName === 'H4') {
              const moveText = cleanText(el.textContent);
              const moveName = cleanText(moveText.replace(/[×\d+\-]/g, ''));
              const damage = moveText.match(/(\d+)(?:[×+\-])?$/)?.[1] || '';
              const description = cleanText(moveElements[i + 1]?.textContent) || '';

              if (description) {
                effects.push({
                  source: 'move',
                  name: moveName,
                  text: description,
                  damage,
                });
              }
            }
          }
        }

        return {
          id: String(id),
          name,
          hp: hp || undefined,
          type: type || undefined,
          set: set || undefined,
          effects,
          scrapedAt: new Date().toISOString(),
        };
      }, cardId);

      return card as CardCorpusEntry | null;
    } catch (error) {
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape a range of cards
   */
  async scrapeRange(options: ScrapeOptions = {}): Promise<CardCorpusEntry[]> {
    const {
      startId = 1,
      endId = 100,
      batchSize = 5,
      delayMs = 500,
      onProgress,
      onError,
    } = options;

    const cards: CardCorpusEntry[] = [];
    const total = endId - startId + 1;
    let current = 0;

    for (let batchStart = startId; batchStart <= endId; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, endId);
      const batchPromises: Promise<CardCorpusEntry | null>[] = [];

      for (let id = batchStart; id <= batchEnd; id++) {
        batchPromises.push(
          this.scrapeCard(id).catch((error) => {
            if (onError) {
              onError(id, error instanceof Error ? error : new Error(String(error)));
            }
            return null;
          })
        );
      }

      const batchResults = await Promise.all(batchPromises);

      for (let i = 0; i < batchResults.length; i++) {
        current++;
        const card = batchResults[i];
        if (card) {
          cards.push(card);
        }
        if (onProgress) {
          onProgress(current, total, card);
        }
      }

      // Delay between batches to avoid rate limiting
      if (batchEnd < endId) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return cards;
  }

  /**
   * Find the approximate range of valid card IDs by binary search
   */
  async findCardIdRange(): Promise<{ minId: number; maxId: number }> {
    // Start with known ranges from pokemon-card.com
    // Card IDs seem to start around 1 and go up to ~50000+ currently
    let minId = 1;
    let maxId = 100000;

    // Binary search to find max valid ID
    while (maxId - minId > 100) {
      const mid = Math.floor((minId + maxId) / 2);
      const card = await this.scrapeCard(mid);
      if (card) {
        minId = mid;
      } else {
        maxId = mid;
      }
    }

    return { minId: 1, maxId: minId };
  }
}

export async function scrapeCard(cardId: number): Promise<CardCorpusEntry | null> {
  const scraper = new CardScraper();
  try {
    await scraper.init();
    return await scraper.scrapeCard(cardId);
  } finally {
    await scraper.close();
  }
}
