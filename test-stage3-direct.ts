/**
 * Direct Stage 3 Vision Analysis Test
 * Tests Claude Vision analysis directly on a simple page
 */

import { getPage, closeBrowser } from './src/browser';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';

async function testStage3Direct() {
  const url = 'https://www.example.com';

  console.log('\n' + '='.repeat(80));
  console.log('DIRECT STAGE 3 VISION TEST');
  console.log('='.repeat(80));
  console.log(`URL: ${url}`);
  console.log(`Purpose: Test Claude Vision screenshot analysis\n`);

  try {
    const { page, close } = await getPage(url);

    console.log('[Stage 3] Running Vision Analysis...\n');
    const result = await stage3VisionAnalysis(page, url);

    console.log('RESULT:');
    console.log(`  Verdict: ${result.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${result.confidence}%`);
    console.log(`  Stage: ${result.stage}`);
    console.log(`  Detection Method: ${result.detectionMethod}`);

    if (result.evidence && result.evidence.length > 0) {
      console.log(`\n  Evidence:`);
      result.evidence.forEach((e) => console.log(`    • ${e}`));
    }

    if (result.claudeAnalysis?.reasoning) {
      console.log(`\n  Reasoning: ${result.claudeAnalysis.reasoning}`);
    }

    console.log(`\n  Raw Response:`, JSON.stringify(result.rawResponse, null, 2));

    await close();
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
  }

  await closeBrowser();
  console.log('\n' + '='.repeat(80));
}

testStage3Direct().catch(console.error);
