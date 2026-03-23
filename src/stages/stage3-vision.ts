/**
 * Stage 3: Screenshot Visual Analysis with Claude Vision
 * Takes a screenshot of the page and analyzes it for visual age gates
 *
 * This catches things text-based detection misses:
 * - Image-based age gates
 * - Canvas-rendered overlays
 * - Heavily styled modals where text isn't in innerText
 * - Graphics-based gates
 */

import { Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { sendPromptToClaude } from '../claude';
import { Stage3Result, ClaudeAgeGateResponse } from '../types';

const STAGE3_VISION_SYSTEM_PROMPT = `You are an expert at visually detecting age verification gates on websites by analyzing screenshots.
Your task is to examine a webpage screenshot and determine if there is an age verification gate visible.

You MUST respond with valid JSON only—no explanation, no markdown, no prose outside the JSON object.

Look specifically for visual indicators:
- Modal overlays or dialogs blocking the main content
- Age gate forms asking for date of birth (input fields, select dropdowns)
- Text saying "you must be 18/21 to enter" or similar age restrictions
- Yes/No entry buttons for age verification
- Blurred, darkened, or obscured background content (suggests modal is active)
- Welcome screens specifically for age-gating
- Any UI elements that appear to be blocking normal page access

Return ONLY this JSON structure:
{
  "hasAgeVerification": true/false/null,
  "confidence": 0.0-1.0,
  "evidence": ["description of what you see", "..."],
  "reasoning": "brief explanation of what you observed"
}

Where:
- hasAgeVerification: true if clear age gate visible on screen, false if definitely visible no gate, null if unsure
- confidence: 0.0 = no confidence, 1.0 = 100% certain
- evidence: array of specific visual elements you detected
- reasoning: 1-2 sentences explaining your assessment`;

/**
 * Take screenshot and convert to base64
 */
async function capturePageScreenshot(page: Page, url: string): Promise<string> {
  // Take screenshot of current viewport (not fullPage - age gates appear above the fold)
  const screenshotBuffer = await page.screenshot({
    fullPage: false,
    type: 'png',
  });

  // Save screenshot to disk
  try {
    const screenshotDir = join(process.cwd(), 'screenshots');
    mkdirSync(screenshotDir, { recursive: true });

    // Create filename with timestamp and sanitized URL
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const urlSanitized = url
      .replace(/https?:\/\//g, '')
      .replace(/[\/?#]/g, '_')
      .substring(0, 50); // Limit length
    const filename = `${urlSanitized}_${timestamp}.png`;
    const filepath = join(screenshotDir, filename);

    writeFileSync(filepath, screenshotBuffer);
    console.log(`[Stage 3] Screenshot saved to: ${filepath}`);
  } catch (saveError) {
    const errorMsg = saveError instanceof Error ? saveError.message : String(saveError);
    console.warn(`[Stage 3] Warning: Failed to save screenshot - ${errorMsg}`);
  }

  // Convert buffer to base64
  return screenshotBuffer.toString('base64');
}

/**
 * Stage 3: Analyze page with Claude Vision
 */
export async function stage3VisionAnalysis(page: Page, url: string): Promise<Stage3Result> {
  try {
    // Capture screenshot
    console.log('[Stage 3] Capturing screenshot...');
    const imageBase64 = await capturePageScreenshot(page, url);
    const imageSizeKB = Math.round((imageBase64.length * 3) / (4 * 1024)); // Base64 is ~33% larger

    console.log(`[Stage 3] Screenshot captured: ${imageSizeKB}KB`);

    // Build user prompt
    const userPrompt = `Analyze this screenshot for age verification gates.

URL: ${url}

Examine the screenshot carefully for any visual indicators of age verification, such as modal dialogs, input fields for age/date of birth, "you must be 18+" messaging, or content obscuration.`;

    // Send to Claude with image
    console.log('[Stage 3] Sending to Claude Vision...');
    const claudeResponse = await sendPromptToClaude(STAGE3_VISION_SYSTEM_PROMPT, {
      text: userPrompt,
      imageBase64,
      imageMediaType: 'image/png',
    });

    // Parse JSON response
    let parsedResponse: ClaudeAgeGateResponse;
    try {
      // Handle markdown code blocks
      let jsonString = claudeResponse.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Stage 3] Failed to parse Claude response as JSON:', claudeResponse);
      return {
        url,
        verdict: 'undetermined',
        confidence: 0,
        stage: 3,
        evidence: ['Claude vision response parsing failed'],
        detectionMethod: 'claude-vision',
        rawResponse: claudeResponse,
      };
    }

    // Validate response shape
    if (!('hasAgeVerification' in parsedResponse) || !('confidence' in parsedResponse)) {
      console.error('[Stage 3] Claude response missing required fields:', parsedResponse);
      return {
        url,
        verdict: 'undetermined',
        confidence: 0,
        stage: 3,
        evidence: ['Invalid Claude vision response structure'],
        detectionMethod: 'claude-vision',
        rawResponse: parsedResponse,
      };
    }

    // Convert Claude's hasAgeVerification to verdict
    let verdict: 'yes' | 'no' | 'undetermined';
    if (parsedResponse.hasAgeVerification === true) {
      verdict = 'yes';
    } else if (parsedResponse.hasAgeVerification === false) {
      verdict = 'no';
    } else {
      verdict = 'undetermined';
    }

    // Convert confidence from 0-1 to 0-100
    const confidence = Math.round((parsedResponse.confidence || 0) * 100);

    console.log(`[Stage 3] Result: ${verdict.toUpperCase()} (${confidence}% confidence)`);
    console.log(`[Stage 3] Screenshot size: ${imageSizeKB}KB | Est. cost: $${(imageSizeKB * 0.003).toFixed(4)}`);

    return {
      url,
      verdict,
      confidence,
      stage: 3,
      evidence: parsedResponse.evidence || (parsedResponse.reasoning ? [parsedResponse.reasoning] : []),
      detectionMethod: 'claude-vision',
      claudeAnalysis: {
        hasAgeVerification: parsedResponse.hasAgeVerification,
        reasoning: parsedResponse.reasoning,
      },
      screenshot: imageBase64, // Include base64 screenshot in result
      rawResponse: parsedResponse,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Stage 3] Error during vision analysis:', errorMsg);

    return {
      url,
      verdict: 'undetermined',
      confidence: 0,
      stage: 3,
      evidence: [`Stage 3 error: ${errorMsg}`],
      detectionMethod: 'claude-vision',
    };
  }
}
