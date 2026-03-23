/**
 * Direct Stage 4 Content Analysis Test
 * Tests Utah legal harm assessment directly
 */

import { getPage, closeBrowser } from './src/browser';
import { stage4ContentAnalysis } from './src/stages/stage4-content';

async function testStage4Direct() {
  // Test on a variety of content types
  const testUrls = [
    {
      url: 'https://www.example.com',
      description: 'Plain example domain (expected: NO)',
    },
    {
      url: 'https://www.wikipedia.org',
      description: 'Educational content (expected: NO)',
    },
    {
      url: 'https://www.bbc.com/news',
      description: 'News site (expected: NO)',
    },
  ];

  console.log('\n' + '='.repeat(100));
  console.log('STAGE 4: UTAH LEGAL HARM ASSESSMENT TEST');
  console.log('='.repeat(100));
  console.log(
    'Analyzing content against Utah Code 76-10-1201 (Harmful to Minors definition)\n'
  );

  for (const testCase of testUrls) {
    const { url, description } = testCase;

    console.log('\n' + '─'.repeat(100));
    console.log(`URL: ${url}`);
    console.log(`Description: ${description}`);
    console.log('─'.repeat(100));

    try {
      const { page, close } = await getPage(url);

      console.log('[Stage 4] Running legal content analysis...\n');
      const result = await stage4ContentAnalysis(page);

      console.log('LEGAL VERDICT:');
      console.log(`  Verdict: ${result.verdict.toUpperCase()}`);
      console.log(`  Confidence: ${result.confidence}%`);
      console.log(`  All Prongs Met: ${result.all_prongs_met}`);

      console.log('\nTHREE-PRONG ANALYSIS:');
      console.log(`  Prong 1 (Prurient Interest):`);
      console.log(
        `    ${result.prong1_analysis.substring(0, 150)}${result.prong1_analysis.length > 150 ? '...' : ''}`
      );
      console.log(`\n  Prong 2 (Offensive Depiction):`);
      console.log(
        `    ${result.prong2_analysis.substring(0, 150)}${result.prong2_analysis.length > 150 ? '...' : ''}`
      );
      console.log(`\n  Prong 3 (Lacks Serious Value):`);
      console.log(
        `    ${result.prong3_analysis.substring(0, 150)}${result.prong3_analysis.length > 150 ? '...' : ''}`
      );

      if (result.evidence.length > 0) {
        console.log(`\nEVIDENCE CITED:`);
        result.evidence.slice(0, 3).forEach((ev) =>
          console.log(
            `  • ${ev.substring(0, 80)}${ev.length > 80 ? '...' : ''}`
          )
        );
      }

      await close();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`✗ Test ERROR: ${errorMsg}`);
    }
  }

  await closeBrowser();
  console.log('\n' + '='.repeat(100));
  console.log('STAGE 4 TEST COMPLETE');
  console.log('='.repeat(100) + '\n');
}

testStage4Direct().catch(console.error);
