/**
 * Stage 4 Only Test - Pornhub
 * Skips Stages 1-3, runs only Stage 4 legal content analysis
 */

import { getPage, closeBrowser } from './src/browser';
import { stage4ContentAnalysis } from './src/stages/stage4-content';

const testUrl = 'https://www.pornhub.com';

async function testStage4Only() {
  console.log('\n' + '='.repeat(110));
  console.log('STAGE 4 ONLY TEST - PORNHUB');
  console.log('='.repeat(110));
  console.log('Skipping Stages 1-3, running Stage 4 legal content analysis only\n');

  console.log('─'.repeat(110));
  console.log(`URL: ${testUrl}`);
  console.log(`Purpose: Legal harm assessment against Utah Code 76-10-1201`);
  console.log('─'.repeat(110));

  try {
    const { page, close } = await getPage(testUrl);

    console.log('\n[STAGE 4] Legal Content Analysis (Utah Statute 76-10-1201)');
    console.log('[SKIPPING Stages 1-3 as requested]\n');

    const stage4 = await stage4ContentAnalysis(page);

    console.log('LEGAL VERDICT:');
    console.log(`  Verdict: ${stage4.verdict.toUpperCase()}`);
    console.log(`  Confidence: ${stage4.confidence}%`);
    console.log(`  All Prongs Met: ${stage4.all_prongs_met}`);

    console.log('\nTHREE-PRONG LEGAL ANALYSIS:');
    console.log(`\n  Prong 1 (Prurient Interest - Appeals to sexual curiosity in minors):`);
    console.log(`    ${stage4.prong1_analysis}`);

    console.log(`\n  Prong 2 (Offensive Depiction - Patently offensive sexual content):`);
    console.log(`    ${stage4.prong2_analysis}`);

    console.log(`\n  Prong 3 (Lacks Serious Value - No literary/artistic/educational value):`);
    console.log(`    ${stage4.prong3_analysis}`);

    if (stage4.evidence.length > 0) {
      console.log(`\nEVIDENCE CITED FROM PAGE:`);
      stage4.evidence.slice(0, 5).forEach((ev) =>
        console.log(`  • ${ev.substring(0, 100)}${ev.length > 100 ? '...' : ''}`)
      );
    }

    await close();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`✗ Test ERROR: ${errorMsg}`);
  }

  await closeBrowser();
  console.log('\n' + '='.repeat(110));
  console.log('✓ STAGE 4 ONLY TEST COMPLETE');
  console.log('='.repeat(110) + '\n');
}

testStage4Only().catch(console.error);
