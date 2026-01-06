/**
 * CLI script to run coverage analysis on the card corpus
 *
 * Usage:
 *   npx ts-node scripts/run-coverage.ts
 *   npx ts-node scripts/run-coverage.ts --verbose
 *   npx ts-node scripts/run-coverage.ts --limit 100
 */

import { CoverageTracker } from '../app/lib/coverage/coverage-tracker';
import {
  loadAllCards,
  saveCoverageResults,
  saveCoverageReport,
  saveFailedEffects,
  getCorpusStats,
} from '../app/lib/coverage/corpus-store';

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  let limit: number | undefined;

  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limit = parseInt(args[limitIndex + 1], 10);
  }

  console.log('Pokemon TCG Parser Coverage Analysis');
  console.log('====================================');
  console.log('');

  // Check corpus stats
  const stats = getCorpusStats();
  console.log('Corpus Statistics:');
  console.log(`  Total cards: ${stats.totalCards}`);
  console.log(`  Total effects: ${stats.totalEffects}`);
  console.log(`  Last updated: ${stats.lastUpdated}`);
  console.log('');

  if (stats.totalCards === 0) {
    console.log('No cards in corpus. Run scrape-cards.ts first.');
    console.log('  npx ts-node scripts/scrape-cards.ts --start 47000 --end 47100');
    return;
  }

  // Load cards
  console.log('Loading cards from corpus...');
  let cards = loadAllCards();

  if (limit) {
    console.log(`Limiting to first ${limit} cards`);
    cards = cards.slice(0, limit);
  }

  const totalEffects = cards.reduce((sum, c) => sum + c.effects.length, 0);
  console.log(`Loaded ${cards.length} cards with ${totalEffects} effects`);
  console.log('');

  // Run coverage analysis
  console.log('Running coverage analysis...');
  const tracker = new CoverageTracker();

  let parsed = 0;
  let failed = 0;

  await tracker.trackCards(cards, {
    onProgress: (current, total, result) => {
      if (result.parseSuccess) {
        parsed++;
      } else {
        failed++;
      }
      if (verbose) {
        const status = result.parseSuccess ? '✓' : '✗';
        console.log(`[${current}/${total}] ${status} ${result.cardName}: ${result.effectText.slice(0, 50)}...`);
      } else {
        process.stdout.write(`\r[${current}/${total}] Parsed: ${parsed}, Failed: ${failed}`);
      }
    },
  });

  console.log('\n');

  // Generate report
  const report = tracker.generateReport();

  console.log('Coverage Report');
  console.log('---------------');
  console.log(`Total Effects: ${report.totalEffects}`);
  console.log(`Parsed Successfully: ${report.parsedSuccessfully}`);
  console.log(`Failed to Parse: ${report.failedToParse}`);
  console.log(`Coverage: ${report.coveragePercentage.toFixed(2)}%`);
  console.log('');

  // Show top unparsed patterns
  if (report.unparsedPatterns.length > 0) {
    console.log('Top Unparsed Patterns:');
    for (const pattern of report.unparsedPatterns.slice(0, 10)) {
      console.log(`  ${pattern.pattern}: ${pattern.count} occurrences`);
      if (verbose && pattern.examples.length > 0) {
        console.log(`    Example: ${pattern.examples[0].slice(0, 80)}...`);
      }
    }
    console.log('');
  }

  // Save results
  console.log('Saving results...');
  const results = tracker.getResults();
  saveCoverageResults(results);
  saveCoverageReport(report);
  saveFailedEffects(results);

  console.log('Results saved to data/coverage/');
  console.log('  - results-<timestamp>.json: Full results');
  console.log('  - report-latest.json: Coverage report');
  console.log('  - failed-effects.json: Failed parses for analysis');
}

main().catch(console.error);
