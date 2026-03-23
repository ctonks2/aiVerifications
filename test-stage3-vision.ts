/**
 * Stage 3 Vision Analysis Demonstration
 * Tests Claude Vision for detecting visual age gates
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';

async function testStage3Vision() {
  // Test URLs - some should have visual age gates
  const testUrls = [
    {
      url: 'https://www.example.com',
      description: 'Control: No age gate',
    },
    {
      url: 'https://www.pornhub.com',
      description: 'Known age gate (should stop at Stage 1)',
    },
  ];

  console.log('\n' + '='.repeat(80));
  console.log('STAGE 3 VISION ANALYSIS DEMONSTRATION');
  console.log('='.repeat(80));

  for (const testCase of testUrls) {
    const { url, description } = testCase;

    console.log(`\nTesting: ${url}`);
    console.log(`Description: ${description}`);
    console.log('─'.repeat(80));

    try {
      const { page, requestUrls, close } = await getPage(url);

      // STAGE 1
      console.log('[Stage 1] Network & HTML Analysis');
      const stage1 = await detectAgeVerification(page, requestUrls);
      console.log(`  Verdict: ${stage1.verdict.toUpperCase()} (${stage1.confidence}%)`);

      // STAGE 2 (if inconclusive)
      let stage2Verdict = stage1.verdict;
      let stage2Confidence = stage1.confidence;

      if (stage1.verdict === 'undetermined') {
        console.log('[Stage 2] Claude DOM Text Analysis');
        const stage2 = await stage2DomAnalysis(page, url);
        console.log(`  Verdict: ${stage2.verdict.toUpperCase()} (${stage2.confidence}%)`);
        stage2Verdict = stage2.verdict;
        stage2Confidence = stage2.confidence;

        // STAGE 3 (if still inconclusive)
        if (stage2.verdict === 'undetermined') {
          console.log('[Stage 3] Claude Vision Analysis');
          const stage3 = await stage3VisionAnalysis(page, url);

          console.log(`  Verdict: ${stage3.verdict.toUpperCase()} (${stage3.confidence}%)`);
          console.log(`  Detection Method: ${stage3.detectionMethod}`);

          if (stage3.evidence && stage3.evidence.length > 0) {
            console.log(`  Evidence:`);
            stage3.evidence.slice(0, 3).forEach((e) => console.log(`    • ${e}`));
          }

          if (stage3.claudeAnalysis?.reasoning) {
            console.log(`  Reasoning: ${stage3.claudeAnalysis.reasoning}`);
          }

          stage2Verdict = stage3.verdict;
          stage2Confidence = stage3.confidence;
        } else {
          console.log(
            `[Stage 3] Skipped (Stage 2 confident: ${stage2.confidence}%)`
          );
        }
      } else {
        console.log(
          `[Stage 2] Skipped (Stage 1 confident: ${stage1.confidence}%)`
        );
        console.log(
          `[Stage 3] Skipped (Stage 1 confident: ${stage1.confidence}%)`
        );
      }

      console.log('\nFinal Result:');
      console.log(`  Verdict: ${stage2Verdict.toUpperCase()}`);
      console.log(`  Confidence: ${stage2Confidence}%`);

      await close();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${errorMsg}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  await closeBrowser();
}

testStage3Vision().catch(console.error);
