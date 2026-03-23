/**
 * Debug compliance report to see where Stage 1 signals are coming from
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';

async function debugStage1() {
  const url = 'https://www.reddit.com/';
  console.log(`\nDEBUG: Testing Stage 1 on ${url}\n`);

  try {
    const { page, requestUrls, close } = await getPage(url);

    console.log(`Network requests captured: ${requestUrls.length}`);
    console.log('Request URLs:');
    requestUrls.forEach((url, i) => console.log(`  ${i}: ${url}`));

    console.log('\n--- Running detectAgeVerification ---\n');
    const stage1 = await detectAgeVerification(page, requestUrls);

    console.log(`Result:`);
    console.log(`  Verdict: ${stage1.verdict}`);
    console.log(`  Confidence: ${stage1.confidence}`);
    console.log(`  Detection Method: ${stage1.detectionMethod}`);
    console.log(`  Signals (${stage1.signals.length}):`);
    stage1.signals.forEach((sig, i) => console.log(`    ${i}: ${sig}`));
    console.log(`\nDetails:`, JSON.stringify(stage1.details, null, 2));

    await close();
    await closeBrowser();
  } catch (e) {
    console.error('Error:', e);
    await closeBrowser();
  }
}

debugStage1();
