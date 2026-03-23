/**
 * Test Reddit (https://www.reddit.com/) with full 4-stage pipeline
 * Stage 1: Check for explicit age gate
 * Stage 2: Analyze text content for age-restricted indicators
 * Stage 3: Analyze visual content for age-restricted indicators
 * Stage 4: Legal analysis - determine if content SHOULD require age gate
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';
import { stage4ContentAnalysis } from './src/stages/stage4-content';

async function testReddit() {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`Testing: https://www.reddit.com/`);
  console.log(`Full 4-Stage Age Verification Pipeline`);
  console.log(`${'='.repeat(100)}\n`);

  try {
    const { page, requestUrls, close } = await getPage('https://www.reddit.com/');

    // ===== STAGE 1: Check for explicit age gate =====
    console.log('[STAGE 1] Network & HTML - Explicit Age Gate Detection');
    const stage1 = await detectAgeVerification(page, requestUrls);
    console.log(`  Verdict: ${stage1.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage1.confidence}%`);
    if (stage1.signals?.length) {
      console.log(`  Signals: ${stage1.signals.slice(0, 3).join(', ')}${stage1.signals.length > 3 ? '...' : ''}`);
    }

    // Even if Stage 1 says NO, continue to check if content SHOULD have an age gate
    console.log(`\n[STAGE 2] DOM Text - Content Analysis for Age Indicators`);
    const stage2 = await stage2DomAnalysis(page, 'https://www.reddit.com/');
    console.log(`  Verdict: ${stage2.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage2.confidence}%`);
    if (stage2.evidence?.length) {
      console.log(`  Evidence: ${stage2.evidence.slice(0, 2).join(', ')}`);
    }

    // ===== STAGE 3: Visual Analysis =====
    console.log(`\n[STAGE 3] Vision - Screenshot Analysis`);
    const stage3 = await stage3VisionAnalysis(page, 'https://www.reddit.com/');
    console.log(`  Verdict: ${stage3.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage3.confidence}%`);

    // ===== STAGE 4: Legal Analysis =====
    console.log(`\n[STAGE 4] Legal - Content Should Require Age Gate?`);
    const stage4 = await stage4ContentAnalysis(page);
    console.log(`  Verdict: ${stage4.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage4.confidence}%`);
    console.log(`  All Prongs Met: ${stage4.all_prongs_met}`);
    console.log(`\n  Legal Analysis (Utah Code 76-10-1201 - Three-Prong Test):`);
    console.log(`\n  ✓ Prong 1 - Prurient Interest:`);
    console.log(`    ${stage4.prong1_analysis}`);
    console.log(`\n  ✓ Prong 2 - Patently Offensive:`);
    console.log(`    ${stage4.prong2_analysis}`);
    console.log(`\n  ✓ Prong 3 - Serious Value (Literary/Artistic/Educational):`);
    console.log(`    ${stage4.prong3_analysis}`);

    // ===== SUMMARY =====
    console.log(`\n${'='.repeat(100)}`);
    
    // Determine final verdict based on all stages
    let finalVerdict = 'undetermined';
    let finalConfidence = 0;
    
    // Priority: If any stage finds YES with high confidence, that's the answer
    if (stage4.confidence >= 80 && stage4.verdict === 'yes') {
      finalVerdict = 'yes';
      finalConfidence = stage4.confidence;
    } else if (stage3.confidence >= 80 && stage3.verdict === 'yes') {
      finalVerdict = 'yes';
      finalConfidence = stage3.confidence;
    } else if (stage2.confidence >= 80 && stage2.verdict === 'yes') {
      finalVerdict = 'yes';
      finalConfidence = stage2.confidence;
    } else if (stage1.confidence >= 80 && stage1.verdict === 'yes') {
      finalVerdict = 'yes';
      finalConfidence = stage1.confidence;
    } else {
      // If no stage found YES with confidence, use Stage 4 (legal determination)
      finalVerdict = stage4.verdict;
      finalConfidence = stage4.confidence;
    }

    console.log(`FINAL RESULT: ${finalVerdict.toUpperCase()}`);
    console.log(`Confidence: ${finalConfidence}%`);
    console.log(`Analysis: Content SHOULD${finalVerdict === 'yes' ? '' : ' NOT'} require age gate`);
    console.log(`${'='.repeat(100)}\n`);

    await close();
  } catch (error) {
    console.log(`\n[ERROR] ${(error as Error).message}\n`);
    console.log(`${'='.repeat(100)}\n`);
  }

  await closeBrowser();
}

testReddit();
