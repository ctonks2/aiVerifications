/**
 * Stage 2: DOM Text Analysis with Claude
 * Takes rendered page text and sends to Claude for AI-powered age verification detection
 *
 * This is the cheapest and fastest AI stage - text only, no images
 */

import { Page } from 'playwright';
import { analyzeTextWithClaude } from '../claude';
import { sendPromptHybrid } from '../llm-router';
import { Stage2Result, ClaudeAgeGateResponse } from '../types';

/**
 * Extract and clean DOM text from page
 * Removes excessive whitespace, limiting to ~15,000 chars
 */
async function extractCleanPageText(page: Page, maxChars: number = 15000): Promise<string> {
  const domText = await page.evaluate(() => {
    // Get all text from page
    const text = document.body.innerText;

    // Remove excessive whitespace and newlines
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  });

  // Cap at max characters to control token costs
  return domText.slice(0, maxChars);
}

const STAGE2_SYSTEM_PROMPT = `You are an expert age verification detector. Your task is to analyze webpage text and determine if it contains age gating or age verification requirements.

You MUST respond with valid JSON only—no explanation, no markdown, no prose outside the JSON object.

Look specifically for:
- Modal or overlay text saying "18+", "21+", or similar
- Phrases like "you must be of legal age to enter", "verify your age", "age restricted content"
- Date of birth input fields or age entry form references
- Consent checkbox language like "I confirm I am 18+" or "I agree to terms and am of legal age"
- Warnings about "adult only", "mature content", "sexually explicit", "restricted"
- Country/region geo-blocking for restricted content
- Any explicit statement that the site is restricted to certain ages

Return ONLY this JSON structure:
{
  "hasAgeVerification": true/false/null,
  "confidence": 0.0-1.0,
  "evidence": ["quoted text or summary", "..."],
  "reasoning": "brief explanation"
}

Where:
- hasAgeVerification: true if clear age gate detected, false if clearly no age gate, null if genuinely unclear
- confidence: 0.0 = no confidence, 1.0 = 100% certain
- evidence: array of exact quotes or descriptions of what you found
- reasoning: 1-2 sentences explaining your conclusion`;

/**
 * Stage 2: Analyze DOM text with Claude
 */
export async function stage2DomAnalysis(page: Page, url: string): Promise<Stage2Result> {
  try {
    // Extract cleaned page text
    const pageText = await extractCleanPageText(page);

    if (!pageText || pageText.trim().length === 0) {
      return {
        url,
        verdict: 'undetermined',
        confidence: 0,
        stage: 2,
        evidence: ['Page text is empty'],
        detectionMethod: 'claude-dom',
      };
    }

    // Build user prompt with URL and cleaned text
    const userPrompt = `Analyze this webpage for age verification requirements.

URL: ${url}

PAGE TEXT:
${pageText}`;

    // Send to Ollama first (free), fallback to Claude if uncertain
    const { response: claudeResponse, model, cost } = await sendPromptHybrid(
      STAGE2_SYSTEM_PROMPT,
      userPrompt,
      2 // stage 2
    );
    
    // Track which model was used
    const detectionMethod = model === 'ollama' ? 'ollama-dom' : 'claude-dom';

    // Parse JSON response
    let parsedResponse: ClaudeAgeGateResponse;
    try {
      // Claude sometimes wraps JSON in markdown code blocks
      let jsonString = claudeResponse.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Stage 2] Failed to parse Claude response as JSON:', claudeResponse);
      return {
        url,
        verdict: 'undetermined',
        confidence: 0,
        stage: 2,
        evidence: ['Claude response parsing failed'],
        detectionMethod: detectionMethod,
        rawResponse: claudeResponse,
      };
    }

    // Validate response shape
    if (!('hasAgeVerification' in parsedResponse) || !('confidence' in parsedResponse)) {
      console.error('[Stage 2] Claude response missing required fields:', parsedResponse);
      return {
        url,
        verdict: 'undetermined',
        confidence: 0,
        stage: 2,
        evidence: ['Invalid Claude response structure'],
        detectionMethod: detectionMethod,
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

    return {
      url,
      verdict,
      confidence,
      stage: 2,
      evidence: parsedResponse.evidence || (parsedResponse.reasoning ? [parsedResponse.reasoning] : []),
      detectionMethod: detectionMethod,
      claudeAnalysis: {
        hasAgeVerification: parsedResponse.hasAgeVerification,
        reasoning: parsedResponse.reasoning,
      },
      rawResponse: parsedResponse,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Stage 2] Error during DOM analysis:', errorMsg);

    return {
      url,
      verdict: 'undetermined',
      confidence: 0,
      stage: 2,
      evidence: [`Stage 2 error: ${errorMsg}`],
      detectionMethod: 'claude-dom',
    };
  }
}
