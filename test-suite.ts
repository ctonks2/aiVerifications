/**
 * Comprehensive test of age-gated sites
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';

const TEST_CASES = [
  {
    url: 'https://www.pornhub.com',
    expected: 'yes',
    description: 'Adult content site (known age-gated)',
  },
  {
    url: 'https://www.diageo.com', // Alcohol brand (Guinness, Johnnie Walker)
    expected: 'yes',
    description: 'Alcohol brand website',
  },
  {
    url: 'https://www.wikipedia.org',
    expected: 'no',
    description: 'Encyclopedia (should not be age-gated)',
  },
  {
    url: 'https://www.bbc.com',
    expected: 'no',
    description: 'News organization',
  },
];

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('AGE VERIFICATION DETECTION - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(80) + '\n');

  let passedCount = 0;
  let partialCount = 0;
  let failedCount = 0;

  for (const testCase of TEST_CASES) {
    console.log(`\nTesting: ${testCase.description}`);
    console.log(`URL: ${testCase.url}`);
    console.log(`Expected: ${testCase.expected}`);
    console.log('-'.repeat(80));

    try {
      const { page, requestUrls, close } = await getPage(testCase.url);
      const result = await detectAgeVerification(page, requestUrls);

      console.log(`Result: ${result.verdict} (${result.confidence}%)`);
      console.log(`Method: ${result.detectionMethod}`);

      if (result.signals.length > 0) {
        console.log(`Signals: ${result.signals.slice(0, 3).join(' | ')}`);
      }

      // Evaluate test
      let testStatus = '?';
      if (result.verdict === testCase.expected) {
        if (result.confidence >= 70 || result.verdict === 'no') {
          testStatus = '✓ PASS';
          passedCount++;
        } else {
          testStatus = '⚠ PARTIAL';
          partialCount++;
        }
      } else if (result.verdict === 'undetermined') {
        testStatus = '⚠ PARTIAL (inconclusive, needs Stage 2)';
        partialCount++;
      } else {
        testStatus = '✗ FAIL';
        failedCount++;
      }

      console.log(testStatus);
      await close();
    } catch (error) {
      console.log(`✗ ERROR: ${error instanceof Error ? error.message : error}`);
      failedCount++;
    }
  }

  await closeBrowser();

  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Passed:  ${passedCount}/${TEST_CASES.length}`);
  console.log(`Partial: ${partialCount}/${TEST_CASES.length}`);
  console.log(`Failed:  ${failedCount}/${TEST_CASES.length}`);
  console.log('='.repeat(80) + '\n');
}

runTests().catch(console.error);
