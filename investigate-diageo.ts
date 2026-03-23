/**
 * Deep investigation test for Diageo.com
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';

async function investigateDiageo() {
  const url = 'https://www.diageo.com';
  
  console.log('\n' + '='.repeat(80));
  console.log('DETAILED INVESTIGATION: DIAGEO.COM');
  console.log('='.repeat(80) + '\n');

  try {
    const { page, requestUrls, close } = await getPage(url);

    console.log(`Total network requests: ${requestUrls.length}\n`);
    
    // Show all requests that might contain "age" or common CDNs
    console.log('Network requests (filtered for relevance):');
    requestUrls.forEach((url, idx) => {
      if (url.toLowerCase().includes('age') || url.toLowerCase().includes('verify') || 
          url.includes('thales') || url.includes('diageo')) {
        console.log(`  [${idx}] ${url}`);
      }
    });

    console.log('\n\nRunning detection...\n');
    const result = await detectAgeVerification(page, requestUrls);

    console.log(`VERDICT: ${result.verdict}`);
    console.log(`CONFIDENCE: ${result.confidence}%`);
    console.log(`METHOD: ${result.detectionMethod}`);
    
    console.log(`\nSIGNALS:`);
    result.signals.forEach(signal => console.log(`  • ${signal}`));

    console.log(`\nDETAILS:`, JSON.stringify(result.details, null, 2));

    // Now show the HTML content to verify
    console.log('\n' + '='.repeat(80));
    console.log('PAGE CONTENT ANALYSIS');
    console.log('='.repeat(80) + '\n');

    const bodyText = await page.evaluate(() => document.body.innerText);
    const htmlContent = await page.content();

    // Search for age-related content
    if (htmlContent.toLowerCase().includes('age gate') || bodyText.toLowerCase().includes('age gate')) {
      console.log('✓ Found "age gate" in page content');
    }
    if (bodyText.toLowerCase().includes('18+') || htmlContent.toLowerCase().includes('18+')) {
      console.log('✓ Found "18+" in page content');
    }
    if (bodyText.toLowerCase().includes('age verification') || htmlContent.toLowerCase().includes('age verification')) {
      console.log('✓ Found "age verification" in page content');
    }

    // Show first 300 chars of body to see what's on the page
    console.log('\nPage body (first 300 chars):');
    console.log(bodyText.slice(0, 300));

    await close();
  } catch (error) {
    console.error(`Error:`, error instanceof Error ? error.message : error);
  }

  await closeBrowser();
}

investigateDiageo().catch(console.error);
