/**
 * Test Age Verifier on 4chan.org
 * Full 4-stage pipeline test
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';
import { stage4ContentAnalysis } from './src/stages/stage4-content';

async function testUrl(url: string) {
  try {
    console.log(`\n${'='.repeat(100)}`);
    console.log(`Testing: ${url}`);
    console.log(`${'='.repeat(100)}\n`);

    let page;
    let close: () => Promise<void>;

    try {
      const pageResult = await getPage(url);
      page = pageResult.page;
      close = pageResult.close;
    } catch (error) {
      console.log(`[BROWSER] Page load timeout - ${(error as Error).message}\n`);
      console.log(`${'='.repeat(100)}`);
      console.log(`Result: Unable to load page`);
      console.log(`${'='.repeat(100)}\n`);
      return;
    }

    // Stage 1: Network & HTML
    console.log('[STAGE 1] Network & HTML Pattern Analysis');
    const stage1 = await detectAgeVerification(page, requestUrls);
    console.log(`  Verdict: ${stage1.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage1.confidence}%`);
    if (stage1.signals?.length) {
      console.log(`  Signals: ${stage1.signals.join(', ')}`);
    }

    // Check if Stage 1 is conclusive
    if (stage1.confidence >= 95) {
      console.log(`\n[STAGE 2-4] Skipped (Stage 1 confident: ${stage1.confidence}%)\n`);
      console.log(`${'='.repeat(100)}`);
      console.log(`FINAL RESULT: ${stage1.verdict.toUpperCase()} (${stage1.confidence}% confidence)`);
      console.log(`${'='.repeat(100)}\n`);
      await close();
      return;
    }

    // Stage 2: DOM Text Analysis
    console.log('[STAGE 2] DOM Text Analysis');
    let stage2Result = stage1;
    try {
      const stage2 = await Promise.race([
        stage2DomAnalysis(page, url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Stage 2 timeout')), 30000))
      ]);
      console.log(`  Verdict: ${stage2.verdict.toUpperCase()}`);
      console.log(`  Confidence: ${stage2.confidence}%`);
      stage2Result = stage2;

      if (stage2.confidence >= 95) {
        console.log(`\n[STAGE 3-4] Skipped (Stage 2 confident: ${stage2.confidence}%)\n`);
        console.log(`${'='.repeat(100)}`);
        console.log(`FINAL RESULT: ${stage2.verdict.toUpperCase()} (${stage2.confidence}% confidence)`);
        console.log(`${'='.repeat(100)}\n`);
        await close();
        return;
      }
    } catch (error) {
      console.log(`  ⏱ Timeout - moving to Stage 3\n`);
    }

    // Stage 3: Vision Analysis
    console.log('[STAGE 3] Vision Analysis (Screenshot)');
    let stage3Result = stage2Result;
    try {
      const stage3 = await Promise.race([
        stage3VisionAnalysis(page, url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Stage 3 timeout')), 30000))
      ]);
      console.log(`  Verdict: ${stage3.verdict.toUpperCase()}`);
      console.log(`  Confidence: ${stage3.confidence}%`);
      stage3Result = stage3;

      if (stage3.confidence >= 95) {
        console.log(`\n[STAGE 4] Skipped (Stage 3 confident: ${stage3.confidence}%)\n`);
        console.log(`${'='.repeat(100)}`);
        console.log(`FINAL RESULT: ${stage3.verdict.toUpperCase()} (${stage3.confidence}% confidence)`);
        console.log(`${'='.repeat(100)}\n`);
        await close();
        return;
      }
    } catch (error) {
      console.log(`  ⏱ Timeout - moving to Stage 4\n`);
    }

    // Stage 4: Legal Content Analysis
    console.log('[STAGE 4] Legal Content Analysis');
    try {
      const stage4 = await Promise.race([
        stage4ContentAnalysis(page, url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Stage 4 timeout')), 30000))
      ]);
      console.log(`  Verdict: ${stage4.verdict.toUpperCase()}`);
      console.log(`  Confidence: ${stage4.confidence}%`);
      if (stage4.prongAnalysis) {
        console.log(`  Legal Analysis:`);
        console.log(`    - Prurient Interest: ${stage4.prongAnalysis.prongOne}`);
        console.log(`    - Patently Offensive: ${stage4.prongAnalysis.prongTwo}`);
        console.log(`    - Serious Value: ${stage4.prongAnalysis.prongThree}`);
      }

      console.log(`\n${'='.repeat(100)}`);
      console.log(`FINAL RESULT: ${stage4.verdict.toUpperCase()} (${stage4.confidence}% confidence)`);
      console.log(`${'='.repeat(100)}\n`);
    } catch (error) {
      console.log(`  ⏱ Timeout\n`);
      console.log(`${'='.repeat(100)}`);
      console.log(`FINAL RESULT: ${stage3Result.verdict.toUpperCase()} (${stage3Result.confidence}% confidence)`);
      console.log(`${'='.repeat(100)}\n`);
    }

    await close();
  } catch (error) {
    console.error('Error during testing:', error instanceof Error ? error.message : error);
  }
}

// Run test
testUrl('https://4chan.org');
