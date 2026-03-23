/**
 * Stage 2 Success Test - What to expect once Claude credits are available
 */

import { getPage, closeBrowser } from './src/browser';
import { stage2DomAnalysis } from './src/stages/stage2-dom';

async function testStage2Success() {
  // Use a site that clearly should NOT have age verification
  const url = 'https://www.example.com';

  console.log('\n' + '='.repeat(80));
  console.log('STAGE 2 SUCCESS TEST');
  console.log('='.repeat(80));
  console.log(`Testing Claude DOM analysis on: ${url}`);
  console.log('Expected: Claude confirms NO age verification\n');

  try {
    const { page, close } = await getPage(url);

    console.log('[Extracting page text...]');
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log(`  Page text length: ${pageText.length} characters`);
    console.log(`  Sample: ${pageText.slice(0, 100)}...\n`);

    console.log('[Sending to Claude...]');
    const result = await stage2DomAnalysis(page, url);

    console.log('\n' + '─'.repeat(80));
    console.log('CLAUDE ANALYSIS RESULT:');
    console.log('─'.repeat(80));
    console.log(`Verdict: ${result.verdict.toUpperCase()}`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Detection Method: ${result.detectionMethod}`);

    if (result.evidence && result.evidence.length > 0) {
      console.log(`\nEvidence Found:`);
      result.evidence.forEach((e) => console.log(`  • ${e}`));
    }

    if (result.claudeAnalysis?.reasoning) {
      console.log(`\nClaude's Reasoning:`);
      console.log(`  "${result.claudeAnalysis.reasoning}"`);
    }

    console.log('\n' + '='.repeat(80));
    if (result.verdict === 'no' && result.confidence >= 80) {
      console.log('✓ TEST PASSED - Claude correctly identified no age gate');
    } else {
      console.log('⚠ Unexpected result - see evidence above');
    }
    console.log('='.repeat(80) + '\n');

    await close();
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
  }

  await closeBrowser();
}

testStage2Success().catch(console.error);
