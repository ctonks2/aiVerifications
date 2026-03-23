/**
 * Age Verification Detection Tests
 * Tests against known age-gated and safe websites
 */

import { getPage, closeBrowser } from './browser';
import { detectAgeVerification, AgeDetectionResult } from './ageDetector';

interface TestCase {
  url: string;
  expectedVerdict: 'yes' | 'no' | 'undetermined';
  description: string;
}

const TEST_CASES: TestCase[] = [
  // Safe websites (should return "no")
  {
    url: 'https://www.example.com',
    expectedVerdict: 'no',
    description: 'Example.com - Generic domain example',
  },
  {
    url: 'https://www.wikipedia.org',
    expectedVerdict: 'no',
    description: 'Wikipedia - Encyclopedia (no age gate)',
  },
  // Age-gated websites would go here - uncomment to test against real sites
  // {
  //   url: 'https://www.pornhub.com',
  //   expectedVerdict: 'yes',
  //   description: 'Pornhub - Adult content (age-gated)',
  // },
  // {
  //   url: 'https://www.diageo.com',
  //   expectedVerdict: 'yes',
  //   description: 'Diageo - Alcohol brand (age-verified)',
  // },
];

function formatResult(result: AgeDetectionResult): string {
  const lines = [
    `Verdict: ${result.verdict.toUpperCase()} (Confidence: ${result.confidence}%)`,
    `Detection Method: ${result.detectionMethod}`,
  ];

  if (result.signals.length > 0) {
    lines.push('\nSignals:');
    result.signals.forEach((signal) => lines.push(`  • ${signal}`));
  }

  return lines.join('\n');
}

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('AGE VERIFICATION DETECTION TEST SUITE');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of TEST_CASES) {
    console.log(`\nTest: ${testCase.description}`);
    console.log(`URL: ${testCase.url}`);
    console.log(`Expected: ${testCase.expectedVerdict.toUpperCase()}`);
    console.log('-'.repeat(80));

    try {
      const { page, requestUrls, close } = await getPage(testCase.url);
      const result = await detectAgeVerification(page, requestUrls);

      const passed_result = result.verdict === testCase.expectedVerdict;
      const status = passed_result ? '✓ PASS' : '✗ FAIL';

      console.log(`Actual: ${result.verdict.toUpperCase()}`);
      console.log(`Status: ${status}`);
      console.log('\n' + formatResult(result));

      if (passed_result) {
        passed++;
      } else {
        failed++;
      }

      results.push({
        testCase: testCase.description,
        expected: testCase.expectedVerdict,
        actual: result.verdict,
        passed: passed_result,
      });

      await close();
    } catch (error) {
      console.log(`Status: ✗ ERROR`);
      console.log(`Error: ${error instanceof Error ? error.message : error}`);
      failed++;

      results.push({
        testCase: testCase.description,
        expected: testCase.expectedVerdict,
        actual: 'error',
        passed: false,
      });
    }
  }

  await closeBrowser();

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  • ${r.testCase}: expected ${r.expected}, got ${r.actual}`);
      });
  }

  console.log('\n' + '='.repeat(80));
}

runTests().catch(console.error);
