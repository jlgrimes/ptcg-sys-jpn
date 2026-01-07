/**
 * Card Image Helper
 *
 * Provides utilities for fetching card images from Vercel Blob storage.
 * Falls back to constructing URLs from pokemon-card.com if blob URL not found.
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
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

// Cache the image map in memory
let imageMapCache: ImageMap | null = null;
let cacheLoadTime: number = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Load the image map from disk (with caching)
 */
function loadImageMap(): ImageMap {
  const now = Date.now();

  // Return cached version if still valid
  if (imageMapCache && now - cacheLoadTime < CACHE_TTL_MS) {
    return imageMapCache;
  }

  // Load from disk
  if (!fs.existsSync(IMAGE_MAP_PATH)) {
    imageMapCache = {};
    cacheLoadTime = now;
    return imageMapCache;
  }

  try {
    const content = fs.readFileSync(IMAGE_MAP_PATH, 'utf-8');
    imageMapCache = JSON.parse(content) as ImageMap;
    cacheLoadTime = now;
    return imageMapCache;
  } catch (error) {
    console.error('Error loading image map:', error);
    imageMapCache = {};
    cacheLoadTime = now;
    return imageMapCache;
  }
}

/**
 * Get the image URL for a card
 *
 * Returns the Vercel Blob URL if available, otherwise falls back to
 * the original pokemon-card.com URL pattern.
 */
export function getCardImageUrl(cardId: string): string {
  const imageMap = loadImageMap();
  const entry = imageMap[cardId];

  if (entry?.blobUrl) {
    return entry.blobUrl;
  }

  // Fallback: construct URL from pokemon-card.com
  // Note: This may be slow and could fail if the site changes
  return `https://www.pokemon-card.com/assets/images/card_images/large/${cardId}.png`;
}

/**
 * Get image URLs for multiple cards
 */
export function getCardImageUrls(cardIds: string[]): Record<string, string> {
  const imageMap = loadImageMap();
  const result: Record<string, string> = {};

  for (const cardId of cardIds) {
    const entry = imageMap[cardId];
    if (entry?.blobUrl) {
      result[cardId] = entry.blobUrl;
    } else {
      result[cardId] = `https://www.pokemon-card.com/assets/images/card_images/large/${cardId}.png`;
    }
  }

  return result;
}

/**
 * Check if a card has a cached blob URL
 */
export function hasCardImage(cardId: string): boolean {
  const imageMap = loadImageMap();
  return !!imageMap[cardId]?.blobUrl;
}

/**
 * Get all cached card IDs
 */
export function getCachedCardIds(): string[] {
  const imageMap = loadImageMap();
  return Object.keys(imageMap);
}

/**
 * Get image map stats
 */
export function getImageStats(): { totalImages: number; lastUpdated: string | null } {
  const imageMap = loadImageMap();
  const entries = Object.values(imageMap);

  if (entries.length === 0) {
    return { totalImages: 0, lastUpdated: null };
  }

  // Find most recent upload
  const lastUpdated = entries.reduce((latest, entry) => {
    const entryDate = new Date(entry.uploadedAt);
    return entryDate > latest ? entryDate : latest;
  }, new Date(0));

  return {
    totalImages: entries.length,
    lastUpdated: lastUpdated.toISOString(),
  };
}

// Client-side compatible version (doesn't use fs)
export const cardImageHelpers = {
  /**
   * Construct a fallback URL for a card image
   * This is always available client-side without needing the image map
   */
  getFallbackUrl(cardId: string): string {
    return `https://www.pokemon-card.com/assets/images/card_images/large/${cardId}.png`;
  },

  /**
   * Get a placeholder image URL
   */
  getPlaceholderUrl(): string {
    return '/card-placeholder.png';
  },
};
