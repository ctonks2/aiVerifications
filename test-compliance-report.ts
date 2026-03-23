/**
 * Compliance Report Generator
 * For Division of Consumer Protection (Utah SB73 enforcement)
 * 
 * Generates a compliance report indicating:
 * - COMPLIANT: Age verification found
 * - NOT_COMPLIANT: No age verification but harmful content detected
 * - NOT_REQUIRED: No age verification and no harmful content
 * - UNCERTAIN: Cannot determine, needs human review
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';
import { stage4ContentAnalysis } from './src/stages/stage4-content';
import { ComplianceReport } from './src/types';

async function generateComplianceReport(url: string): Promise<ComplianceReport> {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`COMPLIANCE REPORT GENERATOR`);
  console.log(`URL: ${url}`);
  console.log(`${'='.repeat(100)}\n`);

  try {
    const { page, requestUrls, close } = await getPage(url);

    // ===== STAGE 1: Network & HTML Detection =====
    console.log('[STAGE 1] Network & HTML Pattern Analysis');
    const stage1 = await detectAgeVerification(page, requestUrls);
    console.log(`  Verdict: ${stage1.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage1.confidence}%`);

    // If Stage 1 finds age verification with HIGH confidence, STOP HERE
    if (stage1.verdict === 'yes' && stage1.confidence >= 80) {
      console.log(`\n✅ HIGH-CONFIDENCE age verification detected at Stage 1`);
      console.log(`   Skipping Stages 2-4 (Stage 1 is conclusive)\n`);

      const report: ComplianceReport = {
        url,
        complianceStatus: 'COMPLIANT',
        confidence: stage1.confidence,
        humanReviewNeeded: false,
        ageVerificationFound: {
          found: true,
          stage: 1,
          location: 'Network requests and HTML patterns',
          details: stage1.signals?.join('; '),
        },
        explanation: `Age verification infrastructure detected at Stage 1 with ${stage1.confidence}% confidence. ${stage1.signals?.length || 0} verification provider(s) found in network requests and/or HTML patterns. Site is COMPLIANT.`,
        investigatorNotes: `Found age verification via: ${stage1.signals?.slice(0, 3).join(', ')}${(stage1.signals?.length || 0) > 3 ? '...' : ''}. Navigate to network tab to confirm.`,
        allStages: {
          stage1,
        },
      };

      await close();
      await closeBrowser();
      return report;
    }

    // Stage 1 inconclusive or LOW confidence - Continue to Stages 2-4
    console.log(`\n[Stage 1 Inconclusive - Proceeding to Stages 2-4]\n`);

    // ===== STAGE 2: DOM Text Analysis =====
    console.log('[STAGE 2] DOM Text - Content Analysis for Age Indicators');
    const stage2 = await stage2DomAnalysis(page, url);
    console.log(`  Verdict: ${stage2.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage2.confidence}%`);

    // Check if Stage 2 found age verification
    if (stage2.verdict === 'yes' && stage2.confidence >= 80) {
      console.log(`\n✅ Age verification found in DOM text at Stage 2`);

      const report: ComplianceReport = {
        url,
        complianceStatus: 'COMPLIANT',
        confidence: stage2.confidence,
        humanReviewNeeded: false,
        ageVerificationFound: {
          found: true,
          stage: 2,
          location: 'Page DOM text content',
          details: stage2.evidence?.slice(0, 2).join('; '),
        },
        explanation: `Age verification detected in page text/content at Stage 2 with ${stage2.confidence}% confidence. Site is COMPLIANT.`,
        investigatorNotes: `Evidence found: ${stage2.evidence?.slice(0, 2).join('; ')}`,
        allStages: { stage1, stage2 },
      };

      await close();
      await closeBrowser();
      return report;
    }

    // ===== STAGE 3: Vision Analysis =====
    console.log(`\n[STAGE 3] Vision - Screenshot Analysis`);
    const stage3 = await stage3VisionAnalysis(page, url);
    console.log(`  Verdict: ${stage3.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage3.confidence}%`);

    // Check if Stage 3 found age verification
    if (stage3.verdict === 'yes' && stage3.confidence >= 80) {
      console.log(`\n✅ Age verification detected in screenshot at Stage 3`);

      const report: ComplianceReport = {
        url,
        complianceStatus: 'COMPLIANT',
        confidence: stage3.confidence,
        humanReviewNeeded: false,
        ageVerificationFound: {
          found: true,
          stage: 3,
          location: 'Visual screenshot analysis',
          details: 'Age gate overlay or verification modal detected',
        },
        explanation: `Age verification detected visually at Stage 3 with ${stage3.confidence}% confidence. Visual age gate or verification prompt visible. Site is COMPLIANT.`,
        investigatorNotes: `Screenshot saved to: screenshots/${url.replace(/https?:\/\//, '').split('/')[0]}_*.png`,
        allStages: { stage1, stage2, stage3 },
      };

      await close();
      await closeBrowser();
      return report;
    }

    // ===== STAGE 4: Legal Content Analysis =====
    console.log(`\n[STAGE 4] Legal - Content Harm Assessment`);
    console.log(`   (Only runs if Stages 1-3 found NO age verification)`);
    const stage4 = await stage4ContentAnalysis(page);
    console.log(`  Verdict: ${stage4.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage4.confidence}%`);
    console.log(`  All Prongs Met (Harmful): ${stage4.all_prongs_met}`);

    // ===== FINAL COMPLIANCE DETERMINATION =====
    console.log(`\n${'='.repeat(100)}`);
    console.log(`COMPLIANCE DETERMINATION`);
    console.log(`${'='.repeat(100)}\n`);

    let complianceStatus: ComplianceReport['complianceStatus'];
    let humanReviewNeeded: boolean;
    let explanation: string;
    let investigatorNotes: string;

    // Determine compliance status based on Stages 2-4
    if (stage4.verdict === 'yes' && stage4.confidence >= 80) {
      // Harmful content detected, no age verification found
      complianceStatus = 'NOT_COMPLIANT';
      humanReviewNeeded = true;
      explanation = `No age verification found in any stage (1-4). Content analysis determined material is harmful to minors (${stage4.confidence}% confidence). All three legal prongs are met. Site is NOT COMPLIANT with SB73.`;
      investigatorNotes = `PRIORITY: Harmful content detected without age verification. Recommend enforcement action. Legal analysis: Prong 1 (Prurient Interest): ${stage4.prong1_analysis?.substring(0, 100)}...`;
    } else if (stage4.verdict === 'no' && stage4.confidence >= 80) {
      // No harmful content, no age verification (but not required)
      complianceStatus = 'NOT_REQUIRED';
      humanReviewNeeded = false;
      explanation = `No age verification found in any stage (1-4). Content analysis determined material is NOT harmful to minors (${stage4.confidence}% confidence). Age verification not required.`;
      investigatorNotes = `Site does not contain material harmful to minors per Utah legal definition. Age verification check not required.`;
    } else {
      // Uncertain
      complianceStatus = 'UNCERTAIN';
      humanReviewNeeded = true;
      explanation = `Unable to definitively determine compliance. Stages 1-3 did not find age verification, and Stage 4 legal analysis is inconclusive. Manual review recommended. Stage 4 Confidence: ${stage4.confidence}%`;
      investigatorNotes = `Recommend manual review: Navigate to site and check for age verification mechanisms. Assess content against Utah Code 76-10-1201 three-prong test.`;
    }

    const report: ComplianceReport = {
      url,
      complianceStatus,
      confidence: stage4.confidence,
      humanReviewNeeded,
      ageVerificationFound: {
        found: false,
        stage: undefined,
        location: 'Not found in any detection stage',
      },
      explanation,
      investigatorNotes,
      allStages: { stage1, stage2, stage3, stage4 },
    };

    // Print compliance report
    console.log(`Compliance Status: ${report.complianceStatus}`);
    console.log(`Confidence: ${report.confidence}%`);
    console.log(`Human Review Needed: ${report.humanReviewNeeded ? '🚩 YES' : '✅ NO'}`);
    console.log(`\nExplanation:\n${report.explanation}`);
    console.log(`\nInvestigator Notes:\n${report.investigatorNotes}`);
    console.log(`\n${'='.repeat(100)}\n`);

    await close();
    return report;
  } catch (error) {
    const errorMsg = (error as Error).message;
    console.error(`\n[ERROR] ${errorMsg}\n`);

    const report: ComplianceReport = {
      url,
      complianceStatus: 'UNCERTAIN',
      confidence: 0,
      humanReviewNeeded: true,
      ageVerificationFound: { found: false },
      explanation: `Error during automated analysis: ${errorMsg}`,
      investigatorNotes: `Page could not be analyzed. Recommend manual review.`,
    };

    await closeBrowser();
    return report;
  }
}

// Test on Reddit
(async () => {
  const report = await generateComplianceReport('https://www.reddit.com/');
  console.log('\n[FINAL REPORT OBJECT]');
  console.log(JSON.stringify(report, null, 2));
})();
