/**
 * Express API Server for Age Verification Compliance Testing
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateComplianceReport } from './test-5-sites-sequential';
import { getPage, closeBrowser } from './src/browser';
import { stage0BlockDetection } from './src/stages/stage0-blockDetection';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';
import { stage4ContentAnalysis } from './src/stages/stage4-content';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for test history
interface TestResult {
  id: string;
  url: string;
  timestamp: number;
  status: string;
  confidence: number;
  ageVerificationFound: boolean;
  stage: number | null;
  humanReviewNeeded: boolean;
  explanation: string;
  investigatorNotes?: string;
  codeEvidence?: Array<{ description: string; code: string; type: string; location?: string }>; // Code snippets from detection
  fullReport?: any; // Complete ComplianceReport with all stages and details
}

const testHistory: TestResult[] = [];

// Test a URL
app.post('/api/test', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    console.log(`[API] Testing URL: ${url}`);

    // Run the compliance report with skipPrompt=true for API mode
    console.log(`[API] Starting compliance report generation...`);
    const report = await generateComplianceReport(url, true);
    console.log(`[API] ✓ Report generated successfully`);
    console.log(`[API] Status: ${report.complianceStatus}, Confidence: ${report.confidence}%`);
    console.log(`[API] All stages available: ${JSON.stringify(Object.keys(report.allStages || {}))}`);

    // Add to history
    const testResult: TestResult = {
      id: `test-${Date.now()}`,
      url,
      timestamp: Date.now(),
      status: report.complianceStatus,
      confidence: report.confidence,
      ageVerificationFound: report.ageVerificationFound.found,
      stage: report.ageVerificationFound.stage || null,
      humanReviewNeeded: report.humanReviewNeeded,
      explanation: report.explanation,
      investigatorNotes: report.investigatorNotes,
      codeEvidence: report.allStages?.stage0?.codeEvidence, // Extract code evidence from stage 0
      fullReport: report, // Store complete report with all stages
    };

    testHistory.unshift(testResult);

    console.log(`[API] ✓ Response sent successfully`);
    res.json({
      success: true,
      result: report,
      testResult,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] ⚠️  Error processing test:', errorMsg);
    console.error('[API] Stack:', error instanceof Error ? error.stack : 'N/A');
    res.status(500).json({
      error: 'Error processing test',
      message: errorMsg,
    });
  }
});

// Test all stages (forced) - runs all 4 stages regardless of confidence
app.post('/api/test-all-stages', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    console.log(`[API] Testing all stages for URL: ${url}`);

    const { page, requestUrls, close } = await getPage(url);

    try {
      // Stage 0
      const stage0 = await stage0BlockDetection(page, url);
      if (stage0.verdict === 'uncertain') {
        await close();
        res.status(400).json({
          error: 'Page blocked by bot-detection',
          stage0: stage0 as any,
        });
        return;
      }

      // Stage 1
      const stage1 = await detectAgeVerification(page, requestUrls);

      // Stage 2
      const stage2 = await stage2DomAnalysis(page, url);

      // Stage 3
      const stage3 = await stage3VisionAnalysis(page, url);

      // Stage 4
      const stage4 = await stage4ContentAnalysis(page, url);

      // Compile results
      const allStagesResult = {
        url,
        timestamp: Date.now(),
        stages: {
          stage0: {
            verdict: stage0.verdict,
            confidence: stage0.blockDetected.confidence,
            explanation: stage0.blockDetected.explanation,
          },
          stage1: {
            verdict: stage1.verdict,
            confidence: stage1.confidence,
            detectionMethod: stage1.detectionMethod,
            signals: stage1.signals,
            details: stage1.details,
          },
          stage2: {
            verdict: stage2.verdict,
            confidence: stage2.confidence,
            detectionMethod: stage2.detectionMethod,
            evidence: stage2.evidence,
            claudeAnalysis: stage2.claudeAnalysis,
          },
          stage3: {
            verdict: stage3.verdict,
            confidence: stage3.confidence,
            detectionMethod: stage3.detectionMethod,
            evidence: stage3.evidence,
            claudeAnalysis: stage3.claudeAnalysis,
            hasScreenshot: !!stage3.screenshot,
          },
          stage4: {
            verdict: stage4.verdict,
            confidence: stage4.confidence,
            content_category: (stage4 as any).content_category,
            requires_age_verification: (stage4 as any).requires_age_verification,
            category_analysis: (stage4 as any).category_analysis,
            content_assessment: (stage4 as any).content_assessment,
          },
        },
      };

      // Add to history
      const testResult: TestResult = {
        id: `test-all-${Date.now()}`,
        url,
        timestamp: Date.now(),
        status: 'ALL_STAGES_TEST',
        confidence: stage1.confidence,
        ageVerificationFound: stage1.verdict === 'yes' || stage2.verdict === 'yes' || stage3.verdict === 'yes',
        stage: 1,
        humanReviewNeeded: false,
        explanation: 'All 4 stages analyzed. Check detailed results.',
        investigatorNotes: `Forced all-stages test. Stage 1: ${stage1.verdict} | Stage 2: ${stage2.verdict} | Stage 3: ${stage3.verdict}`,
        fullReport: {
          allStages: {
            stage0,
            stage1,
            stage2,
            stage3,
            stage4,
          },
        },
      };

      testHistory.unshift(testResult);

      res.json({
        success: true,
        result: allStagesResult,
        testResult,
      });
    } finally {
      await close();
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[API] ⚠️  Error processing all-stages test:', errorMsg);
    console.error('[API] Stack:', error instanceof Error ? error.stack : 'N/A');
    res.status(500).json({
      error: 'Error processing all-stages test',
      message: errorMsg,
    });
  }
});
app.get('/api/history', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: testHistory,
    count: testHistory.length,
  });
});

// Clear history
app.post('/api/history/clear', (req: Request, res: Response) => {
  testHistory.length = 0;
  res.json({ success: true, message: 'History cleared' });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n✨ Age Verification API Server running on http://localhost:${PORT}`);
  console.log(`📋 Test endpoint: POST http://localhost:${PORT}/api/test`);
  console.log(`🎬 All-Stages endpoint: POST http://localhost:${PORT}/api/test-all-stages`);
  console.log(`📊 History endpoint: GET http://localhost:${PORT}/api/history\n`);
});
