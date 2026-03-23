/**
 * Comprehensive Three-Stage Pipeline Test
 * Demonstrates the full Stage 1 → Stage 2 → Stage 3 pipeline
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';

interface TestCase {
  url: string;
  description: string;
  expectedStage: number; // Expected final stage reached
}

const testCases: TestCase[] = [
  {
    url: 'https://www.example.com',
    description: 'Empty control page (should be conclusive at Stage 1)',
    expectedStage: 1,
  },
  {
    url: 'https://www.wikipedia.org',
    description: 'General information site (should be conclusive at Stage 1)',
    expectedStage: 1,
  },
  {
    url: 'https://www.pornhub.com',
    description: 'Known age gate (should be conclusive at Stage 1)',
    expectedStage: 1,
  },
];

async function testFullPipeline() {
  console.log('\n' + '='.repeat(100));
  console.log('COMPREHENSIVE THREE-STAGE PIPELINE TEST');
  console.log('='.repeat(100));
  console.log(
    'Testing Stage 1 (Network/HTML) → Stage 2 (Claude Text) → Stage 3 (Claude Vision)\n'
  );

  for (const testCase of testCases) {
    const { url, description, expectedStage } = testCase;

    console.log('\n' + '─'.repeat(100));
    console.log(`URL: ${url}`);
    console.log(`Description: ${description}`);
    console.log(`Expected to reach Stage: ${expectedStage}`);
    console.log('─'.repeat(100));

    try {
      const { page, requestUrls, close } = await getPage(url);

      let finalStage = 1;
      let finalVerdict = 'undetermined';
      let finalConfidence = 0;

      // STAGE 1
      console.log('\n[STAGE 1] Network & HTML Pattern Analysis');
      const stage1 = await detectAgeVerification(page, requestUrls);

      console.log(`  Verdict: ${stage1.verdict.toUpperCase()}`);
      console.log(`  Confidence: ${stage1.confidence}%`);
      console.log(`  Method: ${stage1.detectionMethod}`);
      if (stage1.signals.length > 0) {
        console.log(`  Signals: ${stage1.signals.slice(0, 2).join(', ')}`);
      }

      finalVerdict = stage1.verdict;
      finalConfidence = stage1.confidence;

      // STAGE 2
      if (stage1.verdict === 'undetermined') {
        console.log('\n[STAGE 2] Claude DOM Text Analysis');
        console.log('  Status: RUNNING (Stage 1 inconclusive)');
        const stage2 = await stage2DomAnalysis(page, url);

        console.log(`  Verdict: ${stage2.verdict.toUpperCase()}`);
        console.log(`  Confidence: ${stage2.confidence}%`);
        if (stage2.evidence && stage2.evidence.length > 0) {
          console.log(`  Evidence: ${stage2.evidence.slice(0, 1).join(', ')}`);
        }

        finalStage = 2;
        finalVerdict = stage2.verdict;
        finalConfidence = stage2.confidence;

        // STAGE 3
        if (stage2.verdict === 'undetermined') {
          console.log('\n[STAGE 3] Claude Vision Screenshot Analysis');
          console.log('  Status: RUNNING (Stage 2 inconclusive)');
          const stage3 = await stage3VisionAnalysis(page, url);

          console.log(`  Verdict: ${stage3.verdict.toUpperCase()}`);
          console.log(`  Confidence: ${stage3.confidence}%`);
          if (stage3.evidence && stage3.evidence.length > 0) {
            console.log(`  Evidence: ${stage3.evidence.slice(0, 1).join(', ')}`);
          }

          finalStage = 3;
          finalVerdict = stage3.verdict;
          finalConfidence = stage3.confidence;
        } else {
          console.log(
            `\n[STAGE 3] Skipped (Stage 2 confident: ${stage2.confidence}%)`
          );
        }
      } else {
        console.log(
          `\n[STAGE 2] Skipped (Stage 1 confident: ${stage1.confidence}%)`
        );
        console.log(
          `[STAGE 3] Skipped (Stage 1 confident: ${stage1.confidence}%)`
        );
      }

      console.log('\n' + '─'.repeat(100));
      console.log('PIPELINE RESULT:');
      console.log(`  Final Verdict: ${finalVerdict.toUpperCase()}`);
      console.log(`  Final Confidence: ${finalConfidence}%`);
      console.log(`  Reached Stage: ${finalStage}`);
      console.log(`  Expected Stage: ${expectedStage}`);
      console.log(`  ✓ Test ${finalStage >= expectedStage ? 'PASSED' : 'FAILED'}`);

      await close();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`✗ Test ERROR: ${errorMsg}`);
    }
  }

  await closeBrowser();
  console.log('\n' + '='.repeat(100));
  console.log('COMPREHENSIVE PIPELINE TEST COMPLETE');
  console.log('='.repeat(100) + '\n');
}

testFullPipeline().catch(console.error);
