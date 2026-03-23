/**
 * Test against gambling site - another common age-gated category
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';

async function testGamblingSite() {
  // Using betfair.com as a legitimate, regulated gambling site
  const url = 'https://www.betfair.com';
  
  console.log('\n' + '='.repeat(70));
  console.log('GAMBLING SITE TEST: BETFAIR');
  console.log('='.repeat(70));
  console.log(`URL: ${url}`);
  console.log(`Expected: High confidence "yes" (gambling requires age verification)`);
  console.log('='.repeat(70) + '\n');

  try {
    console.log('Loading page...');
    const { page, requestUrls, close } = await getPage(url);

    console.log(`Network requests captured: ${requestUrls.length}`);
    console.log('Running age verification detection...\n');

    const result = await detectAgeVerification(page, requestUrls);

    console.log(`VERDICT: ${result.verdict.toUpperCase()}`);
    console.log(`CONFIDENCE: ${result.confidence}%`);
    console.log(`DETECTION METHOD: ${result.detectionMethod}`);

    if (result.signals.length > 0) {
      console.log(`\nSIGNALS DETECTED:`);
      result.signals.forEach((signal) => console.log(`  ✓ ${signal}`));
    }

    if (result.details.networkProviders?.length) {
      console.log(`\nNetwork Providers: ${result.details.networkProviders.join(', ')}`);
    }
    if (result.details.htmlPatterns?.length) {
      console.log(`HTML Patterns: ${result.details.htmlPatterns.slice(0, 5).join(', ')}`);
    }
    if (result.details.metaTags?.length) {
      console.log(`Meta Tags: ${result.details.metaTags.join(', ')}`);
    }

    console.log('\n' + '='.repeat(70));
    if (result.verdict === 'yes' && result.confidence >= 60) {
      console.log('✓ GAMBLING TEST PASSED: Site correctly identified as age-restricted');
    } else if (result.verdict === 'undetermined') {
      console.log('⚠ INCONCLUSIVE: Site requires Stage 2 analysis');
    } else {
      console.log('Result recorded for review');
    }
    console.log('='.repeat(70) + '\n');

    await close();
  } catch (error) {
    console.error(`Error:`, error instanceof Error ? error.message : error);
  }

  await closeBrowser();
}

testGamblingSite().catch(console.error);
