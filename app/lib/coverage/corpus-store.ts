import * as fs from 'fs';
import * as path from 'path';
import { CardCorpusEntry, CorpusStats, CoverageReport, CoverageResult } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const CARDS_DIR = path.join(DATA_DIR, 'cards');
const COVERAGE_DIR = path.join(DATA_DIR, 'coverage');

/**
 * Ensure data directories exist
 */
export function ensureDataDirs(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CARDS_DIR)) {
    fs.mkdirSync(CARDS_DIR, { recursive: true });
  }
  if (!fs.existsSync(COVERAGE_DIR)) {
    fs.mkdirSync(COVERAGE_DIR, { recursive: true });
  }
}

/**
 * Save a card to the corpus
 */
export function saveCard(card: CardCorpusEntry): void {
  ensureDataDirs();
  const filePath = path.join(CARDS_DIR, `${card.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(card, null, 2));
}

/**
 * Save multiple cards to the corpus
 */
export function saveCards(cards: CardCorpusEntry[]): void {
  ensureDataDirs();
  for (const card of cards) {
    saveCard(card);
  }
}

/**
 * Load a card from the corpus
 */
export function loadCard(cardId: string): CardCorpusEntry | null {
  const filePath = path.join(CARDS_DIR, `${cardId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CardCorpusEntry;
}

/**
 * Load all cards from the corpus
 */
export function loadAllCards(): CardCorpusEntry[] {
  ensureDataDirs();
  const files = fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.json'));
  const cards: CardCorpusEntry[] = [];

  for (const file of files) {
    const filePath = path.join(CARDS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    try {
      cards.push(JSON.parse(content) as CardCorpusEntry);
    } catch {
      console.warn(`Failed to parse ${file}`);
    }
  }

  return cards;
}

/**
 * Get corpus statistics
 */
export function getCorpusStats(): CorpusStats {
  const cards = loadAllCards();

  let totalEffects = 0;
  const bySet: Record<string, number> = {};

  for (const card of cards) {
    totalEffects += card.effects.length;
    const setName = card.set || 'Unknown';
    bySet[setName] = (bySet[setName] || 0) + 1;
  }

  // Get last modified time of most recent card file
  const files = fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.json'));
  let lastUpdated = new Date(0);
  for (const file of files) {
    const stat = fs.statSync(path.join(CARDS_DIR, file));
    if (stat.mtime > lastUpdated) {
      lastUpdated = stat.mtime;
    }
  }

  return {
    totalCards: cards.length,
    totalEffects,
    bySet,
    lastUpdated: lastUpdated.toISOString(),
  };
}

/**
 * Save coverage results
 */
export function saveCoverageResults(results: CoverageResult[]): void {
  ensureDataDirs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(COVERAGE_DIR, `results-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
}

/**
 * Save coverage report
 */
export function saveCoverageReport(report: CoverageReport): void {
  ensureDataDirs();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(COVERAGE_DIR, `report-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

  // Also save as latest
  const latestPath = path.join(COVERAGE_DIR, 'report-latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
}

/**
 * Load the latest coverage report
 */
export function loadLatestReport(): CoverageReport | null {
  const filePath = path.join(COVERAGE_DIR, 'report-latest.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CoverageReport;
}

/**
 * Save failed effects for analysis
 */
export function saveFailedEffects(results: CoverageResult[]): void {
  ensureDataDirs();
  const failed = results.filter(r => !r.parseSuccess);
  const filePath = path.join(COVERAGE_DIR, 'failed-effects.json');
  fs.writeFileSync(filePath, JSON.stringify(failed, null, 2));
}

/**
 * Load failed effects
 */
export function loadFailedEffects(): CoverageResult[] {
  const filePath = path.join(COVERAGE_DIR, 'failed-effects.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CoverageResult[];
}

/**
 * Export unique effect texts for manual analysis
 */
export function exportUniqueEffects(): void {
  const cards = loadAllCards();
  const uniqueEffects = new Set<string>();

  for (const card of cards) {
    for (const effect of card.effects) {
      uniqueEffects.add(effect.text);
    }
  }

  const filePath = path.join(COVERAGE_DIR, 'unique-effects.txt');
  fs.writeFileSync(filePath, Array.from(uniqueEffects).join('\n\n---\n\n'));
}
