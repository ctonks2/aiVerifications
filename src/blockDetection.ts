/**
 * Detection utility to identify different types of page blocks:
 * 1. Bot-Detection Blocks (CAPTCHA, "Are You Human", etc.) - mark UNCERTAIN
 * 2. Age Verification Gates - continue analysis
 * 3. Extract metadata before being blocked
 */

import { Page } from 'playwright';

export interface CodeEvidence {
  type: 'attribute' | 'text' | 'element' | 'href' | 'form';
  description: string;
  code: string; // Actual HTML/code snippet
  location?: string; // Where it was found (element selector)
}

export interface BlockDetectionResult {
  isBlocked: boolean;
  blockType: 'bot-detection' | 'age-verification' | 'other' | null;
  blockElements: string[];
  codeEvidence?: CodeEvidence[]; // Actual HTML code that triggered detection
  confidence: number; // 0-100
  metadata: SiteMetadata;
  explanation: string;
}

export interface SiteMetadata {
  title: string;
  description: string;
  keywords: string[];
  contentType: string; // gambling, adult, alcohol, news, education, etc.
  hasContactInfo: boolean;
  estimatedIndustry: string;
}

// Bot detection indicators - These indicate the site is blocking automated access
const BOT_DETECTION_PATTERNS = {
  recaptcha: ['g-recaptcha', 'rc-imageselect', 'recaptcha', 'google recaptcha'],
  hcaptcha: ['h-captcha', 'hcaptcha', 'captcha.hcaptcha'],
  cloudflare: [
    'challenge-form',
    'challenge-container',
    'cf_clearance',
    'turnstile',
    'cf-challenge',
  ],
  humanCheck: [
    'press and hold',
    'hold to confirm',
    'prove you are human',
    'confirm you are human',
    'bot check',
    'verify you are human',
  ],
  custom: [
    'captcha-box',
    'verification-check',
    'bot-detection',
    'anti-bot',
    'challenge',
  ],
};

// Age verification indicators - These indicate legitimate age gating
const AGE_VERIFICATION_PATTERNS = {
  formFields: [
    'date-of-birth',
    'dob',
    'birth_date',
    'age',
    'year',
    'month',
    'day',
    'birthdate',
  ],
  ageGates: [
    'age gate',
    'age verification',
    'verify age',
    'age confirm',
    'i am 18',
    'i am 21',
    'enter your date of birth',
    'confirm your age',
    'age restricted',
    'adults only',
  ],
  spinners: ['age-spinner', 'year-picker', 'date-picker', 'dob-picker'],
};

// Content type indicators
const CONTENT_TYPE_KEYWORDS = {
  gambling: [
    'casino',
    'bet',
    'wager',
    'slots',
    'poker',
    'blackjack',
    'roulette',
    'sports betting',
  ],
  alcohol: [
    'wine',
    'beer',
    'liquor',
    'whiskey',
    'vodka',
    'spirits',
    'brewery',
    'distillery',
  ],
  adult: [
    'explicit',
    'adult',
    'mature',
    '18+',
    'xxx',
    'sexual',
    'nude',
    'erotic',
  ],
  tobacco: ['cigarettes', 'vape', 'tobacco', 'nicotine'],
  cannabis: ['marijuana', 'cannabis', 'hemp', 'cbd', 'thc'],
};

/**
 * Extract metadata from page before potential blocking
 */
async function extractMetadata(page: Page): Promise<SiteMetadata> {
  const metadata: SiteMetadata = {
    title: '',
    description: '',
    keywords: [],
    contentType: 'unknown',
    hasContactInfo: false,
    estimatedIndustry: 'unknown',
  };

  try {
    // Get title
    metadata.title = (await page.title()) || '';

    // Get meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    metadata.description = description || '';

    // Get meta keywords
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    metadata.keywords = keywords ? keywords.split(',').map((k) => k.trim()) : [];

    // Get Open Graph type
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    metadata.contentType = ogType || 'unknown';

    // Check for contact info (email, phone)
    const bodyText = await page.textContent('body');
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/;
    metadata.hasContactInfo =
      (bodyText ? emailRegex.test(bodyText) || phoneRegex.test(bodyText) : false) || false;

    // Estimate industry from content
    if (bodyText) {
      const lowerText = bodyText.toLowerCase();
      for (const [industry, keywords] of Object.entries(CONTENT_TYPE_KEYWORDS)) {
        if (keywords.some((kw) => lowerText.includes(kw))) {
          metadata.estimatedIndustry = industry;
          break;
        }
      }
    }
  } catch (error) {
    console.log('[BlockDetection] Warning: Could not extract all metadata:', error instanceof Error ? error.message : '');
  }

  return metadata;
}

/**
 * Extract actual HTML code evidence from page when patterns match
 */
async function extractCodeEvidence(page: Page, category: string, pattern: string): Promise<CodeEvidence | null> {
  try {
    // Try to find matches and extract their HTML
    const evidence = await page.evaluate(({ searchPattern, searchCategory }: { searchPattern: string; searchCategory: string }) => {
      const results: Array<{ type: string; code: string; location: string }> = [];
      
      // Search for input fields with matching attributes
      if (searchCategory === 'formFields') {
        const inputs = document.querySelectorAll(`input[id*="${searchPattern}"], input[name*="${searchPattern}"]`);
        inputs.forEach((el: any) => {
          results.push({
            type: 'form',
            code: el.outerHTML,
            location: el.id || el.name || 'unnamed input'
          });
        });
      }
      
      // Search for text containing the pattern
      const walker = document.createNodeIterator(
        document.body,
        NodeFilter.SHOW_TEXT
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.toLowerCase().includes(searchPattern.toLowerCase())) {
          const parent = (node as any).parentElement;
          if (parent && parent.outerHTML.length < 500) { // Limit HTML size
            results.push({
              type: 'text',
              code: parent.outerHTML,
              location: parent.className || parent.tagName
            });
          }
        }
      }
      
      // Search for elements with matching classes/ids
      const allElements = document.querySelectorAll(`[class*="${searchPattern}"], [id*="${searchPattern}"]`);
      allElements.forEach((el: any) => {
        if (el.outerHTML.length < 500) {
          results.push({
            type: 'element',
            code: el.outerHTML,
            location: el.className || el.id || el.tagName
          });
        }
      });
      
      // Search for links with matching href patterns
      const links = document.querySelectorAll('a[href*="age"], a[href*="verify"], a[href*="gate"], a[href*="adult"]');
      links.forEach((el: any) => {
        results.push({
          type: 'href',
          code: `<a href="${el.href}">${el.textContent}</a>`,
          location: el.href
        });
      });
      
      return results.length > 0 ? results[0] : null;
    }, { searchPattern: pattern, searchCategory: category });
    
    if (evidence) {
      return {
        type: evidence.type as any,
        description: `${category}: ${pattern}`,
        code: evidence.code,
        location: evidence.location
      };
    }
  } catch (error) {
    // Silently continue if extraction fails
  }
  
  return null;
}

/**
 * Detect what type of block is present on the page
 */
export async function detectPageBlock(page: Page): Promise<BlockDetectionResult> {
  console.log('[BlockDetection] Analyzing page for blocks...');

  // Extract metadata early (before any blocking)
  const metadata = await extractMetadata(page);

  const result: BlockDetectionResult = {
    isBlocked: false,
    blockType: null,
    blockElements: [],
    confidence: 0,
    metadata,
    explanation: '',
  };

  try {
    const pageContent = await page.content();
    const bodyText = await page.textContent('body');
    const pageText = (bodyText || '').toLowerCase();

    // Check for bot detection mechanisms
    let botDetectionScore = 0;
    const botDetectedElements: string[] = [];

    for (const [service, patterns] of Object.entries(BOT_DETECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pageContent.includes(pattern) || pageText.includes(pattern.toLowerCase())) {
          botDetectionScore += 25;
          botDetectedElements.push(`${service}: ${pattern}`);
        }
      }
    }

    // Check for age verification mechanisms
    let ageGateScore = 0;
    const ageGateElements: string[] = [];
    const codeEvidenceList: CodeEvidence[] = [];

    for (const [category, patterns] of Object.entries(AGE_VERIFICATION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pageContent.includes(pattern) || pageText.includes(pattern.toLowerCase())) {
          ageGateScore += 20;
          ageGateElements.push(`${category}: ${pattern}`);
          
          // Extract actual code evidence
          const evidence = await extractCodeEvidence(page, category, pattern);
          if (evidence && codeEvidenceList.length < 5) { // Limit to 5 evidence pieces
            codeEvidenceList.push(evidence);
          }
        }
      }
    }

    // Determine block type
    if (botDetectionScore > ageGateScore && botDetectionScore > 0) {
      result.isBlocked = true;
      result.blockType = 'bot-detection';
      result.blockElements = botDetectedElements;
      result.confidence = Math.min(botDetectionScore, 100);
      result.explanation = `Detected bot-detection mechanism: ${botDetectedElements
        .slice(0, 3)
        .join('; ')}. Mark test as UNCERTAIN.`;
    } else if (ageGateScore > 0) {
      result.blockType = 'age-verification';
      result.blockElements = ageGateElements;
      result.codeEvidence = codeEvidenceList; // Add actual code snippets
      result.confidence = Math.min(ageGateScore, 100);
      result.explanation = `Detected age verification gate: ${ageGateElements
        .slice(0, 3)
        .join('; ')}. Continue with analysis.`;
    } else {
      result.blockType = 'other';
      result.explanation = 'No known blocks detected. Page accessible for analysis.';
    }

    console.log(`[BlockDetection] Result: ${result.blockType} (${result.confidence}% confidence)`);
    if (result.blockElements.length > 0) {
      console.log(`[BlockDetection] Elements: ${result.blockElements.slice(0, 3).join('; ')}`);
    }
  } catch (error) {
    console.error('[BlockDetection] Error during detection:', error instanceof Error ? error.message : '');
    result.explanation = 'Error during block detection';
  }

  return result;
}
