/**
 * Test script for pornhub.com - a known age-gated website
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';

async function testPornhub() {
  const url = 'https://www.pornhub.com';
  
  console.log('\n' + '='.repeat(70));
  console.log('AGE VERIFICATION DETECTION TEST: PORNHUB');
  console.log('='.repeat(70));
  console.log(`URL: ${url}`);
  console.log(`Expected: High confidence "yes" with network detection`);
  console.log('='.repeat(70) + '\n');

  try {
    console.log('Loading page...');
    const { page, requestUrls, close } = await getPage(url);

    console.log(`Network requests captured: ${requestUrls.length}`);
    console.log('Running age verification detection...\n');

    const result = await detectAgeVerification(page, requestUrls);

    // Display results
    console.log(`VERDICT: ${result.verdict.toUpperCase()}`);
    console.log(`CONFIDENCE: ${result.confidence}%`);
    console.log(`DETECTION METHOD: ${result.detectionMethod}`);

    if (result.signals.length > 0) {
      console.log(`\nSIGNALS DETECTED:`);
      result.signals.forEach((signal) => console.log(`  ✓ ${signal}`));
    }

    if (Object.keys(result.details).length > 0 && Object.values(result.details).some((v) => v && (Array.isArray(v) ? v.length > 0 : true))) {
      console.log(`\nDETAILS:`);
      if (result.details.networkProviders?.length) {
        console.log(`  Network Providers: ${result.details.networkProviders.join(', ')}`);
      }
      if (result.details.htmlPatterns?.length) {
        console.log(`  HTML Patterns: ${result.details.htmlPatterns.slice(0, 8).join(', ')}`);
      }
      if (result.details.formFields?.length) {
        console.log(`  Form Fields: ${result.details.formFields.join(', ')}`);
      }
      if (result.details.metaTags?.length) {
        console.log(`  Meta Tags: ${result.details.metaTags.slice(0, 3).join(', ')}`);
      }
    }

    // Validation
    console.log('\n' + '='.repeat(70));
    if (result.verdict === 'yes' && result.confidence >= 70) {
      console.log('✓ TEST PASSED: Site correctly identified as age-gated');
    } else if (result.verdict === 'undetermined') {
      console.log('⚠ TEST PARTIAL: Site identified as undetermined (may need Stage 2)');
    } else {
      console.log('✗ TEST FAILED: Site should be identified as age-gated');
    }
    console.log('='.repeat(70) + '\n');

    await close();
  } catch (error) {
    console.error(`Error during test:`, error instanceof Error ? error.message : error);
  }

  await closeBrowser();
}

testPornhub().catch(console.error);
