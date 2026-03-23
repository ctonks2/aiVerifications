/**
 * Debug Stage 1 for Pornhub and Total Wine
 * Find out why age verification wasn't detected in Stage 1
 */

import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';

async function debugSite(url: string) {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`DEBUGGING: ${url}`);
  console.log(`${'='.repeat(100)}\n`);

  try {
    const { page, requestUrls, close } = await getPage(url);

    console.log(`Total Network Requests: ${requestUrls.length}\n`);

    // Show network requests that look like they could be age-related
    console.log('Filtering for potential age-verification related requests:');
    const ageRelatedRequests = requestUrls.filter((req) => {
      const lower = req.toLowerCase();
      return (
        lower.includes('age') ||
        lower.includes('verify') ||
        lower.includes('adult') ||
        lower.includes('18') ||
        lower.includes('21') ||
        lower.includes('gate') ||
        lower.includes('confirm')
      );
    });

    if (ageRelatedRequests.length === 0) {
      console.log('  No age-related network requests found\n');
    } else {
      ageRelatedRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.substring(0, 120)}...`);
      });
      console.log();
    }

    // Get HTML and check for age-related meta tags
    const html = await page.content();
    const bodyText = await page.evaluate(() => document.body.innerText);

    console.log('Checking HTML Head for age-related meta tags:');
    const metaTagPattern = /<meta[^>]*>/gi;
    const metaTags = html.match(metaTagPattern) || [];
    const ageMetaTags = metaTags.filter((tag) => {
      const lower = tag.toLowerCase();
      return (
        lower.includes('age') ||
        lower.includes('adult') ||
        lower.includes('rating') ||
        lower.includes('18') ||
        lower.includes('21')
      );
    });

    if (ageMetaTags.length === 0) {
      console.log('  No age-related meta tags found\n');
    } else {
      ageMetaTags.forEach((tag, i) => {
        console.log(`  ${i + 1}. ${tag}`);
      });
      console.log();
    }

    // Check body text for age keywords
    console.log('Age-related keywords found in body text:');
    const ageKeywords = [
      'must be 18',
      'must be 21',
      'over 18',
      'over 21',
      'age verify',
      'age verification',
      'verify age',
      'confirm age',
      'only for adults',
      'adults only',
      'adult content',
    ];

    const foundKeywords = ageKeywords.filter((keyword) => bodyText.toLowerCase().includes(keyword));
    if (foundKeywords.length === 0) {
      console.log('  None found\n');
    } else {
      foundKeywords.forEach((kw) => {
        console.log(`  ✓ "${kw}"`);
      });
      console.log();
    }

    // Run Stage 1
    console.log('Running Stage 1 detectAgeVerification:');
    const stage1 = await detectAgeVerification(page, requestUrls);
    console.log(`  Verdict: ${stage1.verdict}`);
    console.log(`  Confidence: ${stage1.confidence}%`);
    console.log(`  Detection Method: ${stage1.detectionMethod}`);
    console.log(`  Signals: ${stage1.signals.length} found`);
    if (stage1.signals.length > 0) {
      stage1.signals.forEach((sig) => console.log(`    - ${sig}`));
    }

    await close();
  } catch (err) {
    console.error('Error:', err);
  }
}

async function runDebug() {
  await debugSite('https://www.pornhub.com/');
  await debugSite('https://www.totalwine.com/');
  await closeBrowser();
}

runDebug();
