import { getPage, closeBrowser } from './browser';
import { detectAgeVerification, AgeDetectionResult } from './ageDetector';
import { stage2DomAnalysis } from './stages/stage2-dom';
import { stage3VisionAnalysis } from './stages/stage3-vision';
import { stage4ContentAnalysis } from './stages/stage4-content';
import { DetectionResult } from './types';

const TEST_URLS = [
  'https://www.example.com', // Should be: no
  'https://www.wikipedia.org', // Should be: no
  'https://www.bbc.com/news', // Should be: no
];

async function run() {
  for (const url of TEST_URLS) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Checking: ${url}`);
    console.log('='.repeat(70));

    try {
      const { page, requestUrls, close } = await getPage(url);

      // ===== STAGE 1: Network + HTML Analysis =====
      console.log('\n[Stage 1] Network & HTML Analysis');
      const stage1Result = await detectAgeVerification(page, requestUrls);

      console.log(`  Verdict: ${stage1Result.verdict.toUpperCase()}`);
      console.log(`  Confidence: ${stage1Result.confidence}%`);
      console.log(`  Method: ${stage1Result.detectionMethod}`);

      if (stage1Result.signals.length > 0) {
        console.log(`  Signals:`);
        stage1Result.signals.forEach((signal) => console.log(`    • ${signal}`));
      }

      // ===== STAGE 2: Claude DOM Analysis (if inconclusive) =====
      let finalResult: AgeDetectionResult | DetectionResult = stage1Result;

      if (stage1Result.verdict === 'undetermined') {
        console.log('\n[Stage 2] Claude DOM Text Analysis');
        const stage2Result = await stage2DomAnalysis(page, url);

        console.log(`  Verdict: ${stage2Result.verdict.toUpperCase()}`);
        console.log(`  Confidence: ${stage2Result.confidence}%`);

        if (stage2Result.evidence.length > 0) {
          console.log(`  Evidence:`);
          stage2Result.evidence.slice(0, 3).forEach((ev) => console.log(`    • ${ev}`));
        }

        if (stage2Result.claudeAnalysis?.reasoning) {
          console.log(`  Reasoning: ${stage2Result.claudeAnalysis.reasoning}`);
        }

        // ===== STAGE 3: Claude Vision Analysis (if still inconclusive) =====
        if (stage2Result.verdict === 'undetermined') {
          console.log('\n[Stage 3] Claude Vision Screenshot Analysis');
          const stage3Result = await stage3VisionAnalysis(page, url);

          console.log(`  Verdict: ${stage3Result.verdict.toUpperCase()}`);
          console.log(`  Confidence: ${stage3Result.confidence}%`);

          if (stage3Result.evidence.length > 0) {
            console.log(`  Evidence:`);
            stage3Result.evidence.slice(0, 3).forEach((ev) => console.log(`    • ${ev}`));
          }

          if (stage3Result.claudeAnalysis?.reasoning) {
            console.log(`  Reasoning: ${stage3Result.claudeAnalysis.reasoning}`);
          }

          // Use Stage 3 result if more confident
          if (stage3Result.confidence >= stage2Result.confidence) {
            finalResult = stage3Result;
          } else {
            finalResult = stage2Result;
          }

          // ===== STAGE 4: Content Harm Assessment (if still inconclusive) =====
          if (stage3Result.verdict === 'undetermined') {
            console.log(
              '\n[Stage 4] Content Harm Assessment (Utah Legal Definition)'
            );
            const stage4Result = await stage4ContentAnalysis(page);

            console.log(`  Verdict: ${stage4Result.verdict.toUpperCase()}`);
            console.log(`  Confidence: ${stage4Result.confidence}%`);
            console.log(`  All Legal Prongs Met: ${stage4Result.all_prongs_met}`);

            if (stage4Result.evidence.length > 0) {
              console.log(`  Evidence:`);
              stage4Result.evidence.slice(0, 3).forEach((ev) =>
                console.log(`    • ${ev.substring(0, 80)}${ev.length > 80 ? '...' : ''}`)
              );
            }

            // Use Stage 4 result as it's the most thorough analysis
            finalResult = stage4Result;
          } else {
            console.log(
              `[Stage 4] Skipped (Stage 3 confident: ${stage3Result.confidence}%)`
            );
          }
        } else {
          console.log(`[Stage 3] Skipped (Stage 2 confident: ${stage2Result.confidence}%)`);
          console.log(`[Stage 4] Skipped (Stage 2 confident: ${stage2Result.confidence}%)`);
        }
      } else {
        console.log(`\n[Stage 2] Skipped (Stage 1 confident: ${stage1Result.confidence}%)`);
        console.log(`[Stage 3] Skipped (Stage 1 confident: ${stage1Result.confidence}%)`);
      }

      // ===== FINAL RESULT =====
      console.log(`\n${'─'.repeat(70)}`);
      console.log('FINAL RESULT:');
      console.log(`  Verdict: ${finalResult.verdict.toUpperCase()}`);
      console.log(`  Confidence: ${finalResult.confidence}%`);
      
      // Show detection stage if available
      if ('stage' in finalResult) {
        console.log(`  Detection Stage: ${finalResult.stage}`);
      }

      // Show Stage 4 specific prong analysis
      if ('prong1_analysis' in finalResult) {
        console.log(`\n  UTAH LEGAL ANALYSIS (All prongs must be met for "yes" verdict):`);
        console.log(
          `  Prong 1 (Prurient Interest): ${(finalResult as any).prong1_analysis.substring(0, 100)}...`
        );
        console.log(
          `  Prong 2 (Offensive Depiction): ${(finalResult as any).prong2_analysis.substring(0, 100)}...`
        );
        console.log(
          `  Prong 3 (Lacks Serious Value): ${(finalResult as any).prong3_analysis.substring(0, 100)}...`
        );
        console.log(`  All Prongs Met: ${(finalResult as any).all_prongs_met}`);
      }

      // Show evidence/signals
      if ('evidence' in finalResult && finalResult.evidence && finalResult.evidence.length > 0) {
        console.log(`  Evidence:`);
        finalResult.evidence.slice(0, 5).forEach((ev) => console.log(`    • ${ev}`));
      } else if ('signals' in finalResult && finalResult.signals && finalResult.signals.length > 0) {
        console.log(`  Signals:`);
        finalResult.signals.slice(0, 5).forEach((sig) => console.log(`    • ${sig}`));
      }

      await close();
    } catch (error) {
      console.error(`Error checking ${url}:`, error instanceof Error ? error.message : error);
    }
  }

  await closeBrowser();
  console.log(`\n${'='.repeat(70)}`);
  console.log('✓ Age verification detection complete (4-stage pipeline)');
  console.log('='.repeat(70));
}

run().catch(console.error);
