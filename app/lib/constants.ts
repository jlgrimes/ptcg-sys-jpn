/**
 * Shared constants for the PTCG system
 */

/**
 * Supported card ID range for testing and image scraping.
 * These are card IDs from pokemon-card.com that have been verified
 * to work with the effect parser.
 */
export const SUPPORTED_CARDS = {
  START_ID: 47000,
  END_ID: 47200,
} as const;

/**
 * Get the full range of supported card IDs as an array
 */
export function getSupportedCardIds(): string[] {
  const ids: string[] = [];
  for (let id = SUPPORTED_CARDS.START_ID; id <= SUPPORTED_CARDS.END_ID; id++) {
    ids.push(String(id));
  }
  return ids;
}

/**
 * Check if a card ID is in the supported range
 */
export function isCardSupported(cardId: string | number): boolean {
  const id = typeof cardId === 'string' ? parseInt(cardId, 10) : cardId;
  return id >= SUPPORTED_CARDS.START_ID && id <= SUPPORTED_CARDS.END_ID;
}
