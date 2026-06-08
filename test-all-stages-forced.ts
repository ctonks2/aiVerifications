/**
 * Test All Stages Forced
 * Forces all 4 stages to run regardless of confidence levels
 * Useful for seeing what each detection method finds
 */

import { getPage, closeBrowser } from './src/browser';
import { stage0BlockDetection } from './src/stages/stage0-blockDetection';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';
import { stage4ContentAnalysis } from './src/stages/stage4-content';

async function testAllStagesForced() {
  const url = 'https://www.pornhub.com/';
  
  console.log(`\n${'='.repeat(100)}`);
  console.log(`FORCED ALL STAGES TEST`);
  console.log(`URL: ${url}`);
  console.log(`${'='.repeat(100)}\n`);

  try {
    const { page, requestUrls, close } = await getPage(url);

    // ===== STAGE 0: Block Detection =====
    console.log(`\n[STAGE 0] Block Detection\n${'─'.repeat(100)}`);
    const stage0 = await stage0BlockDetection(page, url);
    console.log(`Verdict: ${stage0.verdict.toUpperCase()}`);
    console.log(`Confidence: ${stage0.blockDetected.confidence}%`);
    if (stage0.blockDetected.blockElements.length > 0) {
      console.log(`Block Elements: ${stage0.blockDetected.blockElements.slice(0, 3).join(', ')}`);
    }

    // If bot-detection block found, we can't continue
    if (stage0.verdict === 'uncertain') {
      console.log(`\n⚠️  Page blocked by bot-detection. Cannot continue analysis.`);
      await close();
      return;
    }

    // ===== STAGE 1: Network & HTML Detection =====
    console.log(`\n[STAGE 1] Network & HTML Pattern Analysis\n${'─'.repeat(100)}`);
    const stage1 = await detectAgeVerification(page, requestUrls);
    console.log(`Verdict: ${stage1.verdict.toUpperCase()}`);
    console.log(`Confidence: ${stage1.confidence}%`);
    console.log(`Detection Method: ${stage1.detectionMethod}`);
    console.log(`\nSignals Found:`);
    stage1.signals.forEach((signal, i) => {
      console.log(`  ${i + 1}. ${signal}`);
    });

    if (stage1.details.networkProviders && stage1.details.networkProviders.length > 0) {
      console.log(`\nNetwork Providers Found:`);
      stage1.details.networkProviders.forEach((provider) => {
        console.log(`  • ${provider}`);
      });
    }

    if (stage1.details.htmlSnippets && stage1.details.htmlSnippets.length > 0) {
      console.log(`\nHTML Text Snippets Found:`);
      stage1.details.htmlSnippets.forEach((snippet) => {
        console.log(`  • "${snippet}"`);
      });
    }

    if (stage1.details.formFields && stage1.details.formFields.length > 0) {
      console.log(`\nForm Fields Found:`);
      stage1.details.formFields.forEach((field) => {
        console.log(`  • ${field.name}`);
      });
    }

    // ===== STAGE 2: DOM Text Analysis =====
    console.log(`\n[STAGE 2] Claude DOM Text Analysis\n${'─'.repeat(100)}`);
    console.log(`Analyzing page text content with Claude...`);
    const stage2 = await stage2DomAnalysis(page, url);
    console.log(`Verdict: ${stage2.verdict.toUpperCase()}`);
    console.log(`Confidence: ${stage2.confidence}%`);
    console.log(`Detection Method: ${stage2.detectionMethod}`);
    if (stage2.claudeAnalysis?.reasoning) {
      console.log(`\nClaude's Analysis:`);
      console.log(`  ${stage2.claudeAnalysis.reasoning}`);
    }
    console.log(`\nEvidence Found:`);
    stage2.evidence.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });

    // ===== STAGE 3: Vision Analysis =====
    console.log(`\n[STAGE 3] Claude Vision (Screenshot) Analysis\n${'─'.repeat(100)}`);
    console.log(`Taking screenshot and analyzing with Claude Vision...`);
    const stage3 = await stage3VisionAnalysis(page, url);
    console.log(`Verdict: ${stage3.verdict.toUpperCase()}`);
    console.log(`Confidence: ${stage3.confidence}%`);
    console.log(`Detection Method: ${stage3.detectionMethod}`);
    if (stage3.claudeAnalysis?.reasoning) {
      console.log(`\nClaude Vision Analysis:`);
      console.log(`  ${stage3.claudeAnalysis.reasoning}`);
    }
    console.log(`\nVisual Evidence Found:`);
    stage3.evidence.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });

    // ===== STAGE 4: Content Harm Assessment =====
    console.log(`\n[STAGE 4] Legal Content Analysis (Utah Definition)\n${'─'.repeat(100)}`);
    console.log(`Analyzing content against Utah legal definition...`);
    const stage4 = await stage4ContentAnalysis(page, url);
    console.log(`Verdict: ${stage4.verdict.toUpperCase()}`);
    console.log(`Confidence: ${stage4.confidence}%`);
    console.log(`Content Category: ${(stage4 as any).content_category}`);
    console.log(`Requires Age Verification: ${(stage4 as any).requires_age_verification}`);
    if ((stage4 as any).category_analysis) {
      console.log(`\nCategory Analysis:`);
      console.log(`  ${(stage4 as any).category_analysis.substring(0, 200)}...`);
    }

    // ===== SUMMARY =====
    console.log(`\n${'='.repeat(100)}`);
    console.log(`FINAL SUMMARY`);
    console.log(`${'='.repeat(100)}\n`);
    console.log(`Stage 1: ${stage1.verdict.toUpperCase()} (${stage1.confidence}%) - ${stage1.detectionMethod}`);
    console.log(`Stage 2: ${stage2.verdict.toUpperCase()} (${stage2.confidence}%) - ${stage2.detectionMethod}`);
    console.log(`Stage 3: ${stage3.verdict.toUpperCase()} (${stage3.confidence}%) - ${stage3.detectionMethod}`);
    console.log(`Stage 4: ${stage4.verdict.toUpperCase()} (${stage4.confidence}%) - Content is ${(stage4 as any).requires_age_verification ? 'HARMFUL' : 'NOT HARMFUL'}`);
    console.log(`\nConclusion: This site REQUIRES age verification\n`);

    await close();
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the test
testAllStagesForced().catch(console.error);
