/**
 * Debug test to see what URLs are actually captured on Reddit
 * and which ones match our age verification providers
 */

import { chromium } from 'playwright';
import { AGE_VERIFICATION_PROVIDERS } from './src/constants';

async function debugRedditNetwork() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const requestUrls: string[] = [];

  // Capture all network requests
  page.on('request', (request) => {
    requestUrls.push(request.url());
  });

  console.log('Loading Reddit...\n');
  try {
    await page.goto('https://www.reddit.com/', {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });
  } catch (e) {
    console.log('Page load timeout or networkidle failed, continuing...\n');
  }

  // Wait a bit more for any lingering requests
  await page.waitForTimeout(3000);

  // Now analyze the captured URLs
  console.log(`\n=== CAPTURED ${requestUrls.length} NETWORK REQUESTS ===\n`);

  const matchedProviders = new Map<string, string[]>();

  for (const url of requestUrls) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const domainParts = domain.split('.');

      for (const provider of AGE_VERIFICATION_PROVIDERS) {
        // Check 1: Full domain match
        if (domain === provider) {
          if (!matchedProviders.has(provider)) {
            matchedProviders.set(provider, []);
          }
          matchedProviders.get(provider)!.push(`[EXACT MATCH] ${url}`);
        }
        // Check 2: Domain contains provider
        else if (domain.includes(provider)) {
          if (!matchedProviders.has(provider)) {
            matchedProviders.set(provider, []);
          }
          matchedProviders.get(provider)!.push(`[CONTAINS] ${url}`);
        }
        // Check 3: Provider contains first part of domain (THE LOOSE ONE)
        else if (provider.includes(domainParts[0])) {
          if (!matchedProviders.has(provider)) {
            matchedProviders.set(provider, []);
          }
          matchedProviders.get(provider)!.push(`[LOOSE MATCH - provider.includes(${domainParts[0]})] ${url}`);
        }
      }
    } catch (e) {
      // Invalid URL
    }
  }

  if (matchedProviders.size === 0) {
    console.log('❌ NO age verification providers found!\n');
  } else {
    console.log(`✅ Found ${matchedProviders.size} provider matches:\n`);
    for (const [provider, urls] of matchedProviders) {
      console.log(`\n${provider}:`);
      for (const url of urls) {
        console.log(`  ${url}`);
      }
    }
  }

  console.log('\n\n=== MATCHING LOGIC TEST ===\n');
  console.log('Testing matching logic for first few URLs:');
  for (let i = 0; i < Math.min(5, requestUrls.length); i++) {
    const url = requestUrls[i];
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const domainParts = domain.split('.');
      
      console.log(`\n[${i}] URL: ${url}`);
      console.log(`    Domain: ${domain}`);
      console.log(`    Domain part [0]: ${domainParts[0]}`);
      
      let matched = false;
      for (const provider of AGE_VERIFICATION_PROVIDERS) {
        if (domain === provider) {
          console.log(`    ✓ EXACT MATCH: ${provider}`);
          matched = true;
        } else if (domain.includes(provider)) {
          console.log(`    ✓ CONTAINS: domain.includes("${provider}")`);
          matched = true;
        } else if (provider.includes(domainParts[0])) {
          console.log(`    ✓ LOOSE: provider.includes("${domainParts[0]}")`);
          matched = true;
        }
      }
      if (!matched) {
        console.log(`    ✗ No match`);
      }
    } catch (e) {}
  }

  console.log('\n\n=== UNIQUE DOMAINS IN REQUESTS ===\n');
  const uniqueDomains = new Set<string>();
  for (const url of requestUrls) {
    try {
      const domain = new URL(url).hostname;
      uniqueDomains.add(domain);
    } catch (e) {}
  }

  const sortedDomains = Array.from(uniqueDomains).sort();
  sortedDomains.forEach((domain) => console.log(domain));

  await browser.close();
}

debugRedditNetwork();
