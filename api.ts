/**
 * Express API Server for Age Verification Compliance Testing
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateComplianceReport } from './test-5-sites-sequential';

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

// Get test history
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
  console.log(`📊 History endpoint: GET http://localhost:${PORT}/api/history\n`);
});
