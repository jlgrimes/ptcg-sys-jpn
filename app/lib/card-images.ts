/**
 * Card Image Helper
 *
 * Provides utilities for constructing card image URLs from Vercel Blob storage.
 * Works on both client and server.
 */

// Blob storage base URL - set via env var or use default from your blob store
const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL
  || 'https://ygwa5ahyi7ltwair.public.blob.vercel-storage.com';

// Fallback to pokemon-card.com if blob not available
const FALLBACK_BASE_URL = 'https://www.pokemon-card.com/assets/images/card_images/large';

/**
 * Get the image URL for a card from blob storage
 */
export function getCardImageUrl(cardId: string): string {
  return `${BLOB_BASE_URL}/card-images/${cardId}.png`;
}

/**
 * Get the fallback image URL (pokemon-card.com)
 */
export function getFallbackImageUrl(cardId: string): string {
  return `${FALLBACK_BASE_URL}/${cardId}.png`;
}

/**
 * Get image URLs for multiple cards
 */
export function getCardImageUrls(cardIds: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const cardId of cardIds) {
    result[cardId] = getCardImageUrl(cardId);
  }
  return result;
}
