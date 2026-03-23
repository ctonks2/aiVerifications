/**
 * Sequential Compliance Test
 * Tests one site at a time with clean output
 */

import readline from 'readline';
import { getPage, closeBrowser } from './src/browser';
import { stage0BlockDetection } from './src/stages/stage0-blockDetection';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';
import { stage4ContentAnalysis } from './src/stages/stage4-content';
import { ComplianceReport } from './src/types';

// Regulatory keywords that prevent COMPLIANT status
const REGULATORY_KEYWORDS = [
  'gambling',
  'alcohol',
  'customers 21',
  'legal drinking age',
  'must be 21',
  'only for ages 21+',
  'betting',
  'wagering',
  'lottery',
];

// Helper function to check if evidence contains regulatory language
function hasRegulatoryLanguage(evidence: string[] | undefined): boolean {
  if (!evidence || evidence.length === 0) return false;
  const evidenceText = evidence.join(' ').toLowerCase();
  return REGULATORY_KEYWORDS.some((keyword) => evidenceText.includes(keyword));
}

// Helper function to prompt user for Stage 2 continuation
function promptContinueToStage2(url: string, stage1Confidence: number, skipPrompt: boolean = false): Promise<boolean> {
  // If skipPrompt is true (e.g., in API mode), automatically continue
  if (skipPrompt) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      `\n⚠️  Stage 1 confidence is ${stage1Confidence}% (below 80% threshold). Continue to Stage 2-4? (y/n): `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      },
    );
  });
}

const SITES_TO_TEST = [
  'https://www.pornhub.com/',
  'https://www.draftkings.com/',
  'https://www.totalwine.com/',
  'https://www.wikipedia.org/',
  'https://www.khanacademy.org/',
];

async function generateComplianceReport(url: string, skipPrompt: boolean = false): Promise<ComplianceReport> {
  try {
    const { page, requestUrls, close } = await getPage(url);

    // ===== STAGE 0: Block Detection =====
    const stage0 = await stage0BlockDetection(page, url);

    // If bot-detection block found, mark test as UNCERTAIN and return
    if (stage0.verdict === 'uncertain') {
      const report: ComplianceReport = {
        url,
        complianceStatus: 'UNCERTAIN',
        confidence: stage0.blockDetected.confidence,
        humanReviewNeeded: true,
        ageVerificationFound: {
          found: false,
          location: 'Unknown - blocked by bot-detection mechanism',
        },
        explanation: `Page blocked by bot-detection mechanism (${
          stage0.blockDetected.blockElements[0] || 'Unknown'
        }). Cannot analyze without human intervention. ${stage0.blockDetected.explanation}`,
        investigatorNotes: `🤖 Bot-Detection Block: ${stage0.blockDetected.blockElements
          .slice(0, 3)
          .join('; ')}. Site metadata extracted: ${stage0.blockDetected.metadata.estimatedIndustry}. Manual verification required to bypass verification check.`,
        allStages: { stage0: stage0 as any },
      };
      await close();
      return report;
    }

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
        explanation: `Age verification infrastructure detected at Stage 1 with ${stage1.confidence}% confidence. ${stage1.signals?.length || 0} verification provider(s) found.`,
        investigatorNotes: `Found age verification via: ${stage1.signals?.slice(0, 3).join(', ')}${(stage1.signals?.length || 0) > 3 ? '...' : ''}`,
        allStages: { stage1 },
      };
      await close();
      return report;
    }

    // Stage 1 confidence < 80%: Ask user if they want to continue to Stage 2-4
    if (stage1.verdict === 'yes' && stage1.confidence < 80) {
      console.log(`\n  ℹ️  Stage 1 found potential age verification with ${stage1.confidence}% confidence (below 80% threshold)`);
      const continueTesting = await promptContinueToStage2(url, stage1.confidence, skipPrompt);

      if (!continueTesting) {
        // User declined further testing
        const report: ComplianceReport = {
          url,
          complianceStatus: 'UNCERTAIN',
          confidence: stage1.confidence,
          humanReviewNeeded: true,
          ageVerificationFound: {
            found: true,
            stage: 1,
            location: 'Network requests and HTML patterns (low confidence)',
            details: stage1.signals?.join('; '),
          },
          explanation: `Stage 1 found potential age verification with ${stage1.confidence}% confidence, but below 80% threshold. Further testing not requested.`,
          investigatorNotes: `Potential indicators: ${stage1.signals?.slice(0, 3).join(', ')}${(stage1.signals?.length || 0) > 3 ? '...' : ''}. Recommend manual review.`,
          allStages: { stage1 },
        };
        await close();
        return report;
      }

      console.log(`  ✓ Continuing to Stages 2-4...`);
    }

    // Stage 1 inconclusive or user accepted continuing - Continue to Stages 2-4
    const stage2 = await stage2DomAnalysis(page, url);

    if (stage2.verdict === 'yes' && stage2.confidence >= 80) {
      // Check if this is REGULATORY age restriction (gambling, alcohol, etc.)
      const isRegulatoryRestriction = hasRegulatoryLanguage(stage2.evidence);

      if (isRegulatoryRestriction) {
        // This is regulatory age constraint, not age-gated content verification - cannot be marked compliant
        const report: ComplianceReport = {
          url,
          complianceStatus: 'UNCERTAIN',
          confidence: stage2.confidence,
          humanReviewNeeded: true,
          ageVerificationFound: {
            found: true,
            stage: 2,
            location: 'Page DOM text content (regulatory)',
            details: stage2.evidence?.slice(0, 2).join('; '),
          },
          explanation: `Page contains age restriction language at Stage 2, but appears to be REGULATORY (gambling/alcohol age requirements) rather than age-gated content verification. Requires human review to confirm actual compliance.`,
          investigatorNotes: `Regulatory age restriction detected: ${stage2.evidence?.slice(0, 2).join('; ')}. Verify this site's content and whether actual age verification/gating is present.`,
          allStages: { stage1, stage2 },
        };
        await close();
        return report;
      }

      // Regular age verification found
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
        explanation: `Age verification detected in page text/content at Stage 2 with ${stage2.confidence}% confidence.`,
        investigatorNotes: `Evidence found: ${stage2.evidence?.slice(0, 2).join('; ')}`,
        allStages: { stage1, stage2 },
      };
      await close();
      return report;
    }

    // ===== STAGE 3: Vision Analysis =====
    const stage3 = await stage3VisionAnalysis(page, url);

    if (stage3.verdict === 'yes' && stage3.confidence >= 80) {
      // Check if this is REGULATORY age restriction
      const isRegulatoryRestriction = hasRegulatoryLanguage(stage3.evidence);

      if (isRegulatoryRestriction) {
        // Regulatory language prevents COMPLIANT status
        const report: ComplianceReport = {
          url,
          complianceStatus: 'UNCERTAIN',
          confidence: stage3.confidence,
          humanReviewNeeded: true,
          ageVerificationFound: {
            found: true,
            stage: 3,
            location: 'Screenshot visual elements (regulatory)',
            details: stage3.evidence?.slice(0, 2).join('; '),
          },
          explanation: `Age verification detected in Stage 3 screenshot, but contains regulatory language. Cannot mark as compliant without human review.`,
          investigatorNotes: `Regulatory indicators found in visual elements: ${stage3.evidence?.slice(0, 2).join('; ')}`,
          allStages: { stage1, stage2, stage3 },
        };
        await close();
        return report;
      }

      // Regular age verification found in Stage 3
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
        explanation: `Age verification modal/overlay detected in screenshot at Stage 3 with ${stage3.confidence}% confidence.`,
        investigatorNotes: `Visual evidence: ${stage3.evidence?.slice(0, 2).join('; ')}`,
        allStages: { stage1, stage2, stage3 },
      };
      await close();
      return report;
    }

    // ===== STAGE 4: Legal Content Analysis =====
    const stage4 = await stage4ContentAnalysis(page, url);

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
          ? true
          : stage4.verdict === 'undetermined' || stage4.confidence < 80
            ? true
            : false,
      ageVerificationFound: {
        found: false,
        location: 'Not found in any detection stage',
      },
      explanation:
        stage4.verdict === 'yes' && stage4.confidence >= 80
          ? `No age verification found in Stages 1-3. Content analysis determined material IS harmful to minors (${stage4.confidence}% confidence). Age verification IS REQUIRED.`
          : `No age verification found in Stages 1-3. Content analysis determined material is NOT harmful to minors (${stage4.confidence}% confidence). Age verification not required.`,
      investigatorNotes:
        stage4.verdict === 'yes' && stage4.confidence >= 80
          ? `🚩 ENFORCEMENT ACTION NEEDED: Site contains harmful material without age verification.`
          : `Site does not contain material harmful to minors per Utah legal definition.`,
      allStages: { stage1, stage2, stage3, stage4 },
    };

    await close();
    return report;
  } catch (err) {
    console.error(`  ❌ ERROR: ${err instanceof Error ? err.message : String(err)}`);
    return {
      url,
      complianceStatus: 'UNCERTAIN',
      confidence: 0,
      humanReviewNeeded: true,
      ageVerificationFound: { found: false },
      explanation: `Error during analysis`,
      investigatorNotes: 'Manual review required due to analysis error.',
    };
  }
}

async function runSequentialTests() {
  console.log(`\n${'='.repeat(120)}`);
  console.log(`SEQUENTIAL COMPLIANCE TEST`);
  console.log(`Testing ${SITES_TO_TEST.length} sites one at a time`);
  console.log(`${'='.repeat(120)}\n`);

  const results: ComplianceReport[] = [];

  for (let i = 0; i < SITES_TO_TEST.length; i++) {
    const url = SITES_TO_TEST[i];
    const domainName = new URL(url).hostname;

    console.log(`\n[${i + 1}/${SITES_TO_TEST.length}] Testing: ${domainName}`);
    console.log(`${'─'.repeat(120)}`);

    const report = await generateComplianceReport(url);
    results.push(report);

    console.log(`\n✓ RESULT:`);
    console.log(`  Status: ${report.complianceStatus}`);
    console.log(`  Confidence: ${report.confidence}%`);
    console.log(`  Review Needed: ${report.humanReviewNeeded ? '🚩 YES' : '✅ NO'}`);
    console.log(`  Age Verification: ${report.ageVerificationFound.found ? `YES (Stage ${report.ageVerificationFound.stage})` : 'NO'}`);
    if (report.ageVerificationFound.found && report.ageVerificationFound.details) {
      console.log(`  Age Providers: ${report.ageVerificationFound.details}`);
    }
    console.log(`  Explanation: ${report.explanation}`);
  }

  // Summary Table
  console.log(`\n\n${'='.repeat(120)}`);
  console.log(`FINAL SUMMARY`);
  console.log(`${'='.repeat(120)}\n`);

  const summaryTable = results.map((r) => ({
    Domain: new URL(r.url).hostname,
    Status: r.complianceStatus,
    Confidence: `${r.confidence}%`,
    'Review?': r.humanReviewNeeded ? '🚩 YES' : '✅ NO',
    'Age Gate?': r.ageVerificationFound.found ? `Stage ${r.ageVerificationFound.stage}` : 'No',
  }));

  console.table(summaryTable);

  console.log(`\n`);
  await closeBrowser();
}

// Export for API usage
export { generateComplianceReport };

// Run CLI if executed directly
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  runSequentialTests().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}
