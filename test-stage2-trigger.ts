/**
 * Stage 2 Demonstration
 * This test uses a URL likely to return "undetermined" from Stage 1
 * so we can see Stage 2 Claude analysis in action
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';

async function testStage2Trigger() {
  // Use a URL that might not have strong Stage 1 signals
  // but has age-related content that Claude can analyze
  const url = 'https://www.betfair.com';

  console.log('\n' + '='.repeat(80));
  console.log('STAGE 2 DEMONSTRATION');
  console.log('='.repeat(80));
  console.log(`URL: ${url}`);
  console.log(`Purpose: Test Stage 1 → Stage 2 pipeline\n`);

  try {
    const { page, requestUrls, close } = await getPage(url);

    // STAGE 1
    console.log('[STAGE 1] Network & HTML Pattern Analysis');
    console.log('─'.repeat(80));
    const stage1 = await detectAgeVerification(page, requestUrls);

    console.log(`Verdict: ${stage1.verdict.toUpperCase()}`);
    console.log(`Confidence: ${stage1.confidence}%`);
    console.log(`Method: ${stage1.detectionMethod}`);
    if (stage1.signals.length > 0) {
      console.log(`Signals: ${stage1.signals.slice(0, 3).join(', ')}`);
    }

    // STAGE 2 (Trigger if inconclusive)
    console.log(`\n[STAGE 2] Claude DOM Text Analysis`);
    console.log('─'.repeat(80));

    if (stage1.verdict === 'undetermined') {
      console.log('Status: RUNNING (Stage 1 inconclusive)');
      const stage2 = await stage2DomAnalysis(page, url);

      console.log(`\nVERDICT: ${stage2.verdict.toUpperCase()}`);
      console.log(`CONFIDENCE: ${stage2.confidence}%`);

      if (stage2.evidence && stage2.evidence.length > 0) {
        console.log(`\nEVIDENCE:`);
        stage2.evidence.forEach((e) => console.log(`  • ${e}`));
      }

      if (stage2.claudeAnalysis?.reasoning) {
        console.log(`\nREASONING:`);
        console.log(`  ${stage2.claudeAnalysis.reasoning}`);
      }

      console.log(`\nClaude Analysis: ${stage2.claudeAnalysis?.hasAgeVerification === true ? '✓ DETECTED' : stage2.claudeAnalysis?.hasAgeVerification === false ? '✗ NOT DETECTED' : '⚠ UNCLEAR'}`);
    } else {
      console.log(`Status: SKIPPED (Stage 1 confident: ${stage1.confidence}%)`);
      console.log('Note: Stage 2 only runs when Stage 1 is inconclusive');
    }

    console.log('\n' + '='.repeat(80));
    await close();
  } catch (error) {
    console.error(`\nError: ${error instanceof Error ? error.message : error}`);
    console.log('\nNote: This is expected if the site is slow or blocks headless browsers');
  }

  await closeBrowser();
}

testStage2Trigger().catch(console.error);
