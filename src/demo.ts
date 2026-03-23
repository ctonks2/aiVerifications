/**
 * Interactive Age Verification Detection Demo
 * Tests arbitrary URLs provided by user
 */

import { getPage, closeBrowser } from './browser';
import { detectAgeVerification } from './ageDetector';

/**
 * Format result for clean console output
 */
function formatReport(url: string, result: ReturnType<typeof detectAgeVerification> extends Promise<infer R> ? R : never): string {
  const lines = [
    '\n' + '='.repeat(80),
    `URL: ${url}`,
    '='.repeat(80),
    `\nVERDICT: ${result.verdict.toUpperCase()}`,
    `CONFIDENCE: ${result.confidence}%`,
    `DETECTION METHOD: ${result.detectionMethod}`,
  ];

  if (result.signals.length > 0) {
    lines.push('\nDETECTION SIGNALS:');
    result.signals.forEach((signal) => {
      lines.push(`  ✓ ${signal}`);
    });
  }

  if (Object.keys(result.details).length > 0) {
    const details = result.details;
    lines.push('\nDETAILS:');

    if (details.networkProviders?.length) {
      lines.push(`  Network Providers:`);
      details.networkProviders.forEach((p) => lines.push(`    → ${p}`));
    }

    if (details.htmlPatterns?.length) {
      lines.push(`  HTML Patterns Found: ${details.htmlPatterns.slice(0, 3).join(', ')}`);
    }

    if (details.formFields?.length) {
      lines.push(`  Age Verification Form Fields: ${details.formFields.join(', ')}`);
    }

    if (details.metaTags?.length) {
      lines.push(`  Adult Content Meta Tags: ${details.metaTags.slice(0, 2).join(', ')}`);
    }
  }

  lines.push('\n' + '='.repeat(80));
  return lines.join('\n');
}

/**
 * Main demo function
 */
async function demo() {
  // URLs to test - modify this to test different sites
  const DEMO_URLS = [
    'https://www.example.com',
    'https://www.wikipedia.org',
  ];

  console.log('\n╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' AGE VERIFICATION DETECTION DEMO'.padEnd(79) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  for (const url of DEMO_URLS) {
    try {
      console.log(`\nAnalyzing: ${url}`);

      const { page, requestUrls, close } = await getPage(url);
      console.log(`  ✓ Page loaded (${requestUrls.length} requests intercepted)`);

      const result = await detectAgeVerification(page, requestUrls);
      console.log(formatReport(url, result));

      await close();
    } catch (error) {
      console.error(`\n✗ Error analyzing ${url}:`);
      console.error(`  ${error instanceof Error ? error.message : error}`);
    }
  }

  await closeBrowser();

  console.log('\nDEMO COMPLETE\n');
}

// Add instructions
console.log(`
╔────────────────────────────────────────────────────────────────────────╗
║ AGE VERIFICATION DETECTOR - DEMO                                       ║
╠────────────────────────────────────────────────────────════════════════╣
║                                                                        ║
║ This demo tests multiple websites for age verification mechanisms.    ║
║                                                                        ║
║ TO TEST YOUR OWN URLS:                                                 ║
║ 1. Edit the DEMO_URLS array in src/demo.ts                            ║
║ 2. Run: npm run demo                                                   ║
║                                                                        ║
║ EXAMPLE URLS TO TEST:                                                  ║
║   • https://www.example.com (safe)                                     ║
║   • https://www.wikipedia.org (safe)                                   ║
║   • https://www.porn*.com (age-gated) ⚠️                               ║
║   • https://www.diageo.com (alcohol, age-verified)                     ║
║   • https://www.betfair.com (gambling, age-verified)                   ║
║                                                                        ║
╚────────────────────────────────────────────────────────────────────────╝
`);

demo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
