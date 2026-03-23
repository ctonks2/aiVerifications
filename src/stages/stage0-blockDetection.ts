/**
 * Stage 0: Block Detection
 * Identifies whether the page is blocked by bot-detection or age-verification
 * This runs FIRST, before any other analysis
 */

import { Page } from 'playwright';
import { detectPageBlock, BlockDetectionResult } from '../blockDetection';

export interface Stage0Result {
  url: string;
  blockDetected: BlockDetectionResult;
  shouldContinue: boolean; // true if age verification, false if bot detection
  verdict: 'proceed' | 'uncertain' | 'blocked';
}

/**
 * Check for blocks before attempting analysis
 */
export async function stage0BlockDetection(page: Page, url: string): Promise<Stage0Result> {
  console.log('\n' + '='.repeat(80));
  console.log('[Stage 0] Block Detection');
  console.log('='.repeat(80));
  console.log(`Checking for bot-detection vs age-verification blocks...\n`);

  const blockDetection = await detectPageBlock(page);

  let verdict: 'proceed' | 'uncertain' | 'blocked' = 'proceed';
  let shouldContinue = true;

  if (blockDetection.blockType === 'bot-detection') {
    verdict = 'uncertain';
    shouldContinue = false;
    console.log(`\n⚠️  BOT-DETECTION BLOCK DETECTED`);
    console.log(`   Type: ${blockDetection.blockElements[0] || 'Unknown'}`);
    console.log(`   Confidence: ${blockDetection.confidence}%`);
    console.log(`   Explanation: ${blockDetection.explanation}`);
    console.log(`\n   ✓ Site metadata extracted for analysis`);
    console.log(`   ✓ Marking test as UNCERTAIN`);
    console.log(`   ✓ Recommendation: Human intervention required for CAPTCHA/verification`);
  } else if (blockDetection.blockType === 'age-verification') {
    verdict = 'proceed';
    shouldContinue = true;
    console.log(`\n✓ AGE VERIFICATION GATE DETECTED`);
    console.log(`   Type: ${blockDetection.blockElements[0] || 'Unknown'}`);
    console.log(`   Confidence: ${blockDetection.confidence}%`);
    console.log(`   Explanation: ${blockDetection.explanation}`);
    console.log(`   ✓ Proceeding with Stage 1+ analysis`);
  } else {
    verdict = 'proceed';
    shouldContinue = true;
    console.log(`\n✓ NO BLOCKS DETECTED`);
    console.log(`   Page is accessible for analysis`);
  }

  // Log extracted metadata
  console.log(`\n📋 Site Metadata:`);
  console.log(`   Title: ${blockDetection.metadata.title || 'None'}`);
  console.log(`   Description: ${blockDetection.metadata.description.substring(0, 60)}...`);
  console.log(`   Estimated Industry: ${blockDetection.metadata.estimatedIndustry}`);
  console.log(`   Keywords: ${blockDetection.metadata.keywords.slice(0, 5).join(', ')}`);
  console.log(`   Has Contact Info: ${blockDetection.metadata.hasContactInfo ? 'Yes' : 'No'}`);

  return {
    url,
    blockDetected: blockDetection,
    shouldContinue,
    verdict,
  };
}
