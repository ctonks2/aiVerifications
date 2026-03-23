/**
 * Comprehensive Test Suite
 * Tests compliance detection across 5 diverse websites
 * 
 * Expected Results:
 * - pornhub.com: Should detect age verification OR harmful content (EITHER NOT_COMPLIANT or COMPLIANT with verification)
 * - draftkings.com: Should detect age verification (Gambling - requires 21+)
 * - totalwine.com: Should detect age verification (Alcohol retailer - requires 21+)
 * - wikipedia.org: Should be NOT_REQUIRED (educational, no harmful content, no age gate)
 * - khanacademy.org: Should be NOT_REQUIRED (educational, no harmful content, no age gate)
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';
import { stage4ContentAnalysis } from './src/stages/stage4-content';
import { ComplianceReport } from './src/types';

const SITES_TO_TEST = [
  'https://www.pornhub.com/',
  'https://www.draftkings.com/',
  'https://www.totalwine.com/',
  'https://www.wikipedia.org/',
  'https://www.khanacademy.org/',
];

async function generateComplianceReport(url: string): Promise<ComplianceReport> {
  try {
    const { page, requestUrls, close } = await getPage(url);

    // ===== STAGE 1: Network & HTML Detection =====
    const stage1 = await detectAgeVerification(page, requestUrls);

    // If Stage 1 finds age verification with HIGH confidence, STOP HERE
    if (stage1.verdict === 'yes' && stage1.confidence >= 80) {
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
        allStages: { stage1 },
      };

      await close();
      return report;
    }

    // Stage 1 inconclusive or LOW confidence - Continue to Stages 2-4
    const stage2 = await stage2DomAnalysis(page, url);

    // Check if Stage 2 found age verification
    if (stage2.verdict === 'yes' && stage2.confidence >= 80) {
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
      return report;
    }

    // ===== STAGE 3: Vision Analysis =====
    const stage3 = await stage3VisionAnalysis(page, url);

    // Check if Stage 3 found age verification
    if (stage3.verdict === 'yes' && stage3.confidence >= 80) {
      const report: ComplianceReport = {
        url,
        complianceStatus: 'COMPLIANT',
        confidence: stage3.confidence,
        humanReviewNeeded: false,
        ageVerificationFound: {
          found: true,
          stage: 3,
          location: 'Screenshot visual elements',
          details: stage3.evidence?.slice(0, 2).join('; '),
        },
        explanation: `Age verification modal/overlay detected in screenshot at Stage 3 with ${stage3.confidence}% confidence. Site is COMPLIANT.`,
        investigatorNotes: `Visual evidence: ${stage3.evidence?.slice(0, 2).join('; ')}`,
        allStages: { stage1, stage2, stage3 },
      };

      await close();
      return report;
    }

    // ===== STAGE 4: Legal Content Analysis =====
    const stage4 = await stage4ContentAnalysis(page, url);

    // Stage 4 determines if content is harmful (all 3 prongs met = harmful content)
    // If YES (all prongs met) = NOT_COMPLIANT (harmful without age verification)
    // If NO (NOT all prongs met) = NOT_REQUIRED (not harmful, no age verification needed)
    // If UNCERTAIN = needs human review

    const report: ComplianceReport = {
      url,
      complianceStatus:
        stage4.verdict === 'yes' && stage4.confidence >= 80
          ? 'NOT_COMPLIANT'
          : stage4.verdict === 'no' && stage4.confidence >= 80
            ? 'NOT_REQUIRED'
            : 'UNCERTAIN',
      confidence: stage4.confidence,
      humanReviewNeeded:
        stage4.verdict === 'yes' && stage4.confidence >= 80
          ? true // NOT_COMPLIANT needs review
          : stage4.verdict === 'undetermined' || stage4.confidence < 80
            ? true // UNCERTAIN needs review
            : false, // NOT_REQUIRED doesn't need review
      ageVerificationFound: {
        found: false,
        location: 'Not found in any detection stage',
      },
      explanation:
        stage4.verdict === 'yes' && stage4.confidence >= 80
          ? `No age verification found in Stages 1-3. Content analysis determined material IS harmful to minors (all three prongs met, ${stage4.confidence}% confidence). Age verification IS REQUIRED.`
          : `No age verification found in Stages 1-3. Content analysis determined material is NOT harmful to minors (${stage4.confidence}% confidence). Age verification not required.`,
      investigatorNotes:
        stage4.verdict === 'yes' && stage4.confidence >= 80
          ? `🚩 ENFORCEMENT ACTION NEEDED: Site contains harmful material without age verification. See detailed prong analysis in allStages.`
          : `Site does not contain material harmful to minors per Utah legal definition. Age verification check not required.`,
      allStages: { stage1, stage2, stage3, stage4 },
    };

    await close();
    return report;
  } catch (err) {
    console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
    return {
      url,
      complianceStatus: 'UNCERTAIN',
      confidence: 0,
      humanReviewNeeded: true,
      ageVerificationFound: { found: false },
      explanation: `Error during analysis: ${err instanceof Error ? err.message : String(err)}`,
      investigatorNotes: 'Manual review required due to analysis error.',
    };
  }
}

async function runAllTests() {
  console.log(`\n${'='.repeat(120)}`);
  console.log(`COMPREHENSIVE COMPLIANCE TEST SUITE`);
  console.log(`Testing ${SITES_TO_TEST.length} diverse websites`);
  console.log(`${'='.repeat(120)}\n`);

  const results: ComplianceReport[] = [];

  for (const url of SITES_TO_TEST) {
    console.log(`\n${'─'.repeat(120)}`);
    console.log(`Testing: ${url}`);
    console.log(`${'─'.repeat(120)}`);

    const report = await generateComplianceReport(url);
    results.push(report);

    console.log(`\n✓ Status: ${report.complianceStatus}`);
    console.log(`  Confidence: ${report.confidence}%`);
    console.log(`  Human Review: ${report.humanReviewNeeded ? '🚩 YES (needs investigation)' : '✅ NO (confidence sufficient)'}`);
    console.log(`  Details: ${report.explanation}`);

    if (report.ageVerificationFound.found) {
      console.log(`  Age Verification: YES (Stage ${report.ageVerificationFound.stage})`);
    } else {
      console.log(`  Age Verification: NO`);
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(120)}`);
  console.log(`SUMMARY OF ALL TESTS`);
  console.log(`${'='.repeat(120)}\n`);

  const summaryTable = results.map((r) => ({
    Domain: new URL(r.url).hostname,
    Status: r.complianceStatus,
    Confidence: `${r.confidence}%`,
    'Review?': r.humanReviewNeeded ? '🚩 YES' : '✅ NO',
    'Age Gate?': r.ageVerificationFound.found ? `Yes (Stage ${r.ageVerificationFound.stage})` : 'No',
  }));

  console.table(summaryTable);

  console.log(`\nDetailed Results (JSON):`);
  console.log(JSON.stringify(results, null, 2));

  await closeBrowser();
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
