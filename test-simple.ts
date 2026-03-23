import { getPage, closeBrowser } from './src/browser';
import { detectAgeVerification } from './src/ageDetector';
import { stage2DomAnalysis } from './src/stages/stage2-dom';
import { stage3VisionAnalysis } from './src/stages/stage3-vision';
import { stage4ContentAnalysis } from './src/stages/stage4-content';

async function test(url: string) {
  console.log(`\nTesting: ${url}\n`);
  try {
    const { page, requestUrls, close } = await getPage(url);
    
    const stage1 = await detectAgeVerification(page, requestUrls);
    console.log(`[Stage 1] ${stage1.verdict.toUpperCase()} (${stage1.confidence}%)`);
    
    if (stage1.confidence < 95) {
      const stage2 = await stage2DomAnalysis(page, url);
      console.log(`[Stage 2] ${stage2.verdict.toUpperCase()} (${stage2.confidence}%)`);
    }
    
    await close();
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
  await closeBrowser();
}

test('https://www.example.com');
