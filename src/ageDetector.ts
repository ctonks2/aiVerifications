/**
 * Age verification detection module
 * Detects age-gated websites through network analysis and HTML pattern matching
 */

import { Page } from 'playwright';
import {
  AGE_VERIFICATION_PROVIDERS,
  AGE_RELATED_KEYWORDS,
  CONSENT_KEYWORDS,
  AGE_FIELD_PATTERNS,
  ADULT_META_TAGS,
} from './constants';

export interface AgeDetectionResult {
  verdict: 'yes' | 'no' | 'undetermined';
  confidence: number; // 0-100
  detectionMethod: 'network' | 'html' | 'combined' | 'none';
  signals: string[];
  details: {
    networkProviders?: string[];
    htmlPatterns?: string[];
    htmlSnippets?: string[];
    consentSnippets?: string[];
    formFields?: Array<{ name: string; html: string }>;
    metaTags?: string[];
  };
}

/**
 * Analyzes captured network requests for age verification providers
 * Uses strict matching: exact domain match or verified provider domain as suffix
 */
function analyzeNetworkRequests(requestUrls: string[]): {
  isAgeGated: boolean;
  providers: string[];
} {
  const foundProviders: string[] = [];

  for (const url of requestUrls) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      for (const provider of AGE_VERIFICATION_PROVIDERS) {
        // Strict matching: only match if provider domain is the exact domain or the full suffix
        // e.g., "ageid.com" matches "ageid.com" or "api.ageid.com" but NOT "id.rlcdn.com"
        if (domain === provider || domain.endsWith('.' + provider)) {
          foundProviders.push(provider);
        }
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return {
    isAgeGated: foundProviders.length > 0,
    providers: [...new Set(foundProviders)],
  };
}

/**
 * Searches HTML for age-related keywords and patterns with actual text snippets
 */
function searchHtmlPatterns(html: string, bodyText: string): {
  hasAgeKeywords: boolean;
  hasConsentLanguage: boolean;
  keywords: string[];
  textSnippets: string[];
  consentSnippets: string[];
} {
  const combinedText = (html + ' ' + bodyText).toLowerCase();
  const foundKeywords: string[] = [];
  const textSnippets: string[] = [];
  const consentSnippets: string[] = [];

  // Find actual text snippets containing keywords
  for (const keyword of AGE_RELATED_KEYWORDS) {
    // Skip generic matches like just "age" unless in context of verification
    if (keyword === 'age' && combinedText.includes(keyword.toLowerCase())) {
      // Only count if it appears multiple times or with verification keywords
      const ageCount = (combinedText.match(/\bage\b/gi) || []).length;
      if (ageCount >= 2 || combinedText.includes('age verify') || combinedText.includes('age gate')) {
        foundKeywords.push(keyword);
      }
    } else if (keyword !== 'age') {
      if (combinedText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        
        // Extract snippet of text containing this keyword
        const regex = new RegExp(`.{0,60}${keyword}.{0,60}`, 'gi');
        const matches = bodyText.match(regex);
        if (matches && matches.length > 0) {
          const snippet = matches[0].trim();
          if (snippet.length > 10 && !textSnippets.includes(snippet)) {
            textSnippets.push(snippet);
          }
        }
      }
    }
  }

  // Find consent language and capture actual text
  let hasConsentLanguage = false;
  for (const consent of CONSENT_KEYWORDS) {
    if (combinedText.includes(consent.toLowerCase())) {
      hasConsentLanguage = true;
      
      // Extract snippet of text containing consent language
      const regex = new RegExp(`.{0,50}${consent}.{0,50}`, 'gi');
      const matches = bodyText.match(regex);
      if (matches && matches.length > 0) {
        const snippet = matches[0].trim();
        if (snippet.length > 10 && !consentSnippets.includes(snippet)) {
          consentSnippets.push(snippet);
        }
      }
      break;
    }
  }

  return {
    hasAgeKeywords: foundKeywords.length > 0,
    hasConsentLanguage,
    keywords: foundKeywords,
    textSnippets,
    consentSnippets,
  };
}

/**
 * Detects age verification form fields in the page and captures their HTML
 */
async function detectFormFields(page: Page): Promise<{ name: string; html: string }[]> {
  const inputs = await page.evaluate(() => {
    const elements: Array<{ name: string; html: string }> = [];

    // Look for input fields with age-related names/ids (but more specific)
    document.querySelectorAll('input[type="date"], input[name*="birth"], input[name*="dob"], input[name*="age-verification"], input[id*="birth"], input[id*="dob"]').forEach((el) => {
      const name = (el as HTMLInputElement).name || (el as HTMLInputElement).id;
      // Filter out false positives like birthday mode toggles
      if (!name.toLowerCase().includes('toggle') && !name.toLowerCase().includes('mode')) {
        elements.push({
          name: name,
          html: (el as HTMLInputElement).outerHTML
        });
      }
    });

    // Look for select boxes with explicit month/day/year pattern for birth date
    document.querySelectorAll('select').forEach((select) => {
      const name = select.name.toLowerCase();
      // Look for explicit birth date patterns or combinations
      if (
        (name.includes('birth') || name.includes('dob')) &&
        (name.includes('month') || name.includes('day') || name.includes('year'))
      ) {
        elements.push({
          name: select.name,
          html: select.outerHTML
        });
      }
    });

    return elements;
  });

  return inputs;
}

/**
 * Detects meta tags and other HTML attributes indicating adult content
 * Returns actual meta tag HTML for verification
 */
async function detectMetaTags(page: Page): Promise<string[]> {
  const tags = await page.evaluate(() => {
    const found: string[] = [];

    // Check meta tags for specific age/adult ratings
    document.querySelectorAll('meta').forEach((meta) => {
      const name = (meta.getAttribute('name') || '').toLowerCase();
      const property = (meta.getAttribute('property') || '').toLowerCase();
      const content = (meta.getAttribute('content') || '').toLowerCase();
      const httpEquiv = (meta.getAttribute('http-equiv') || '').toLowerCase();

      // Flag explicit adult/18+ indicators
      if (
        // RTA (Restricted To Adults) rating - standard adult content rating
        (name === 'rating' && content.includes('rta-')) ||
        // Other adult rating indicators
        (name.includes('rating') && (content.includes('adult') || content.includes('18+') || content.includes('r') || content.includes('nc-17'))) ||
        content.includes('adult content') ||
        content.includes('18+ only') ||
        (name.includes('age') && content.includes('restricted'))
      ) {
        // Return actual meta tag HTML for verification
        found.push(meta.outerHTML);
      }
    });

    return found;
  });

  return tags;
}

/**
 * Main function to detect age verification on a page
 */
export async function detectAgeVerification(
  page: Page,
  requestUrls: string[]
): Promise<AgeDetectionResult> {
  let verdict: 'yes' | 'no' | 'undetermined' = 'undetermined';
  let confidence = 0;
  let detectionMethod: 'network' | 'html' | 'combined' | 'none' = 'none';
  const signals: string[] = [];
  const details: AgeDetectionResult['details'] = {};

  // Stage 1: Network Analysis
  const networkAnalysis = analyzeNetworkRequests(requestUrls);

  if (networkAnalysis.isAgeGated) {
    verdict = 'yes';
    confidence = 95; // Very high confidence
    detectionMethod = 'network';
    details.networkProviders = networkAnalysis.providers;

    for (const provider of networkAnalysis.providers) {
      signals.push(`Detected age verification provider: ${provider}`);
    }
  }

  // Stage 2: HTML Analysis (if network didn't give conclusive result)
  if (verdict !== 'yes') {
    const html = await page.content();
    const bodyText = await page.evaluate(() => document.body.innerText);

    const htmlPatterns = searchHtmlPatterns(html, bodyText);
    const formFields = await detectFormFields(page);
    const metaTags = await detectMetaTags(page);

    // Scoring based on multiple HTML signals
    let htmlScore = 0;

    if (htmlPatterns.hasAgeKeywords) {
      htmlScore += 20;
      details.htmlPatterns = htmlPatterns.keywords;
      details.htmlSnippets = htmlPatterns.textSnippets;
      
      // Build signal with actual text snippets if available
      if (htmlPatterns.textSnippets.length > 0) {
        signals.push(`Found age-related text: "${htmlPatterns.textSnippets[0]}"`);
      } else {
        signals.push(`Found age-related keywords: ${htmlPatterns.keywords.slice(0, 3).join(', ')}`);
      }
    }

    if (htmlPatterns.hasConsentLanguage && htmlPatterns.hasAgeKeywords) {
      htmlScore += 30;
      details.consentSnippets = htmlPatterns.consentSnippets;
      
      // Build signal with actual consent text if available
      if (htmlPatterns.consentSnippets.length > 0) {
        signals.push(`Found consent language: "${htmlPatterns.consentSnippets[0]}"`);
      } else {
        signals.push('Found age-related consent language');
      }
    }

    if (formFields.length > 0) {
      htmlScore += 25;
      details.formFields = formFields;
      // Show actual form field names/IDs
      const fieldNames = formFields.map(f => f.name).join(', ');
      signals.push(`Detected age verification form fields: ${fieldNames}`);
    }

    if (metaTags.length > 0) {
      // RTA ratings are strong indicators - boost score significantly
      const hasRTARating = metaTags.some((tag) => tag.toLowerCase().includes('rta-'));
      htmlScore += hasRTARating ? 40 : 15;
      details.metaTags = metaTags;
      
      // Show actual meta tag HTML
      if (metaTags.length > 0) {
        signals.push(`Detected meta tag: ${metaTags[0]}`);
      }
    }

    if (htmlScore >= 60) {
      verdict = 'yes';
      confidence = htmlScore;
      detectionMethod = networkAnalysis.isAgeGated ? 'combined' : 'html';
    } else if (htmlScore > 20) {
      verdict = 'undetermined';
      confidence = htmlScore;
      detectionMethod = 'html';
    }
  }

  // If no signals detected, verdict is "no"
  if (verdict === 'undetermined' && signals.length === 0) {
    verdict = 'no';
    confidence = 95; // High confidence in negative result if no indicators
  }

  return {
    verdict,
    confidence,
    detectionMethod,
    signals,
    details,
  };
}
