/**
 * Stage 2 Test Suite
 * Tests Claude DOM analysis against known age-gated and non-age-gated sites
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';

const TEST_CASES = [
  {
    url: 'https://www.wikipedia.org',
    name: 'Wikipedia',
    expectStage1: 'no',
    expectStage2: 'no',
    description: 'Safe, non-age-gated encyclopedia'
  },
  {
    url: 'https://www.example.com',
    name: 'Example.com',
    expectStage1: 'no',
    expectStage2: 'no',
    description: 'Generic example site'
  },
];

async function runStage2Tests() {
  console.log('\n' + '='.repeat(80));
  console.log('STAGE 2 DOM TEXT ANALYSIS TEST SUITE');
  console.log('='.repeat(80));
  console.log('Testing Stage 1 → Stage 2 pipeline\n');

  let stage1Correct = 0;
  let stage2Correct = 0;
  let stage2Triggered = 0;

  for (const testCase of TEST_CASES) {
    console.log(`\nTesting: ${testCase.name} (${testCase.description})`);
    console.log('─'.repeat(80));
    console.log(`URL: ${testCase.url}`);

    try {
      const { page, requestUrls, close } = await getPage(testCase.url);

      // STAGE 1
      const stage1 = await detectAgeVerification(page, requestUrls);
      console.log(`\n[Stage 1] ${stage1.verdict.toUpperCase()} (${stage1.confidence}%)`);

      const stage1Matches = stage1.verdict === testCase.expectStage1;
      console.log(`  Expected: ${testCase.expectStage1} → ${stage1Matches ? '✓ PASS' : '✗ FAIL'}`);
      if (stage1Matches) stage1Correct++;

      // STAGE 2 (only if Stage 1 inconclusive)
      if (stage1.verdict === 'undetermined') {
        stage2Triggered++;
        console.log(`\n[Stage 2] Running Claude analysis...`);
        const stage2 = await stage2DomAnalysis(page, testCase.url);

        console.log(`  Result: ${stage2.verdict.toUpperCase()} (${stage2.confidence}%)`);
        if (stage2.evidence && stage2.evidence.length > 0) {
          console.log(`  Evidence: ${stage2.evidence[0]}`);
        }
        if (stage2.claudeAnalysis?.reasoning) {
          console.log(`  Reasoning: ${stage2.claudeAnalysis.reasoning}`);
        }

        const stage2Matches = stage2.verdict === testCase.expectStage2;
        console.log(`  Expected: ${testCase.expectStage2} → ${stage2Matches ? '✓ PASS' : '✗ FAIL'}`);
        if (stage2Matches) stage2Correct++;
      } else {
        console.log(`[Stage 2] Skipped (Stage 1 confident)`);
      }

      await close();
    } catch (error) {
      console.error(`✗ ERROR: ${error instanceof Error ? error.message : error}`);
    }
  }

  await closeBrowser();

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Stage 1: ${stage1Correct}/${TEST_CASES.length} correct (${Math.round((stage1Correct / TEST_CASES.length) * 100)}%)`);
  console.log(`Stage 2 triggered: ${stage2Triggered} times`);
  if (stage2Triggered > 0) {
    console.log(`Stage 2: ${stage2Correct}/${stage2Triggered} correct (${Math.round((stage2Correct / stage2Triggered) * 100)}%)`);
  }
  console.log('='.repeat(80) + '\n');
}

runStage2Tests().catch(console.error);
