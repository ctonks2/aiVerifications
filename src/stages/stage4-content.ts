/**
 * Stage 4: Content Harm Assessment
 * Analyzes page content against Utah legal definition of material harmful to minors
 *
 * This stage only runs if Stages 1-3 were all inconclusive.
 * It does not detect presence of age verification, but rather evaluates
 * whether the content meets the legal definition of harmful material.
 */

import { Page } from 'playwright';
import { sendPromptToClaude } from '../claude';
import { sendPromptHybrid } from '../llm-router';
import {
  UTAH_HARM_SYSTEM_PROMPT,
  Stage4ContentAnalysisInput,
  Stage4Result as UtahStage4Result,
} from '../prompts/utah-harm';

/**
 * Extract structured content signals from page DOM
 */
async function extractPageContent(page: Page): Promise<Stage4ContentAnalysisInput> {
  const contentData = await page.evaluate(() => {
    // Get page title
    const pageTitle =
      document.title ||
      document.querySelector('h1')?.textContent ||
      'Unknown';

    // Get meta tags
    const metaDescription =
      document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const metaKeywords =
      document
        .querySelector('meta[name="keywords"]')
        ?.getAttribute('content')
        ?.split(',')
        .map((k) => k.trim())
        .filter((k) => k) || [];

    // Get Open Graph tags
    const openGraphTags: Record<string, string> = {};
    document.querySelectorAll('meta[property^="og:"]').forEach((meta) => {
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (property && content) {
        openGraphTags[property] = content;
      }
    });

    // Get visible body text (capped at 8000 chars for token cost)
    const body = document.body.innerText;
    const bodyTextContent = body.substring(0, 8000);

    // Get category/tag labels (look for common selectors)
    const categoryLabels: string[] = [];
    const categorySelectors = [
      '[data-category]',
      '.category',
      '.tag',
      '.tags',
      '[aria-label*="category"]',
      '[aria-label*="tag"]',
    ];
    categorySelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length < 100) {
          categoryLabels.push(text);
        }
      });
    });

    // Get navigation link text (reveals site category)
    const navigationText: string[] = [];
    const navSelectors = ['nav a', 'header a', '[role="navigation"] a', '.menu a'];
    navSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length < 100) {
          navigationText.push(text);
        }
      });
    });

    // Get content warnings (look for advisory text)
    const contentWarnings: string[] = [];
    const warningSelectors = [
      '[role="alert"]',
      '.warning',
      '.alert',
      '[data-warning]',
      '[data-advisory]',
    ];
    warningSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 10 && text.length < 500) {
          contentWarnings.push(text);
        }
      });
    });

    return {
      pageTitle,
      metaDescription,
      metaKeywords: [...new Set(metaKeywords)].slice(0, 10), // Deduplicate, limit to 10
      openGraphTags,
      bodyTextContent,
      categoryLabels: [...new Set(categoryLabels)].slice(0, 15), // Deduplicate, limit
      navigationText: [...new Set(navigationText)].slice(0, 20),
      contentWarnings,
    };
  });

  return {
    url: page.url(),
    pageTitle: contentData.pageTitle,
    metaDescription: contentData.metaDescription,
    metaKeywords: contentData.metaKeywords,
    openGraphTags: contentData.openGraphTags,
    bodyTextContent: contentData.bodyTextContent,
    categoryLabels: contentData.categoryLabels,
    navigationText: contentData.navigationText,
    contentWarnings: contentData.contentWarnings,
  };
}

/**
 * Format extracted content into a context block for Claude
 */
function formatContentContext(input: Stage4ContentAnalysisInput): string {
  let context = `# Page Content Analysis\n\n`;

  context += `**URL:** ${input.url}\n`;
  context += `**Page Title:** ${input.pageTitle}\n`;

  if (input.metaDescription) {
    context += `**Meta Description:** ${input.metaDescription}\n`;
  }

  if (input.metaKeywords.length > 0) {
    context += `**Meta Keywords:** ${input.metaKeywords.join(', ')}\n`;
  }

  if (Object.keys(input.openGraphTags).length > 0) {
    context += `\n## Open Graph Data\n`;
    Object.entries(input.openGraphTags).forEach(([key, value]) => {
      context += `- ${key}: ${value}\n`;
    });
  }

  if (input.categoryLabels.length > 0) {
    context += `\n## Categories/Tags\n${input.categoryLabels.join(', ')}\n`;
  }

  if (input.navigationText.length > 0) {
    context += `\n## Navigation Menu Items\n${input.navigationText.join(', ')}\n`;
  }

  if (input.contentWarnings.length > 0) {
    context += `\n## Content Warnings/Advisories Found\n`;
    input.contentWarnings.forEach((warning) => {
      context += `- ${warning}\n`;
    });
  }

  context += `\n## Page Content (First ~8000 characters of visible text)\n`;
  context += `\`\`\`\n${input.bodyTextContent}\n\`\`\`\n`;

  return context;
}

/**
 * Stage 4: Content Harm Assessment using Utah legal definition
 */
export async function stage4ContentAnalysis(page: Page): Promise<Stage4ResultData> {
  const url = page.url();

  try {
    console.log('[Stage 4] Extracting page content signals...');
    const contentInput = await extractPageContent(page);

    console.log(`[Stage 4] Content extracted:`);
    console.log(
      `  - Title: ${contentInput.pageTitle.substring(0, 60)}${contentInput.pageTitle.length > 60 ? '...' : ''}`
    );
    console.log(`  - Keywords: ${contentInput.metaKeywords.length}`);
    console.log(`  - OG Tags: ${Object.keys(contentInput.openGraphTags).length}`);
    console.log(`  - Body Text: ${contentInput.bodyTextContent.length} chars`);
    console.log(`  - Categories: ${contentInput.categoryLabels.length}`);
    console.log(`  - Navigation Links: ${contentInput.navigationText.length}`);
    console.log(`  - Content Warnings: ${contentInput.contentWarnings.length}`);

    // Format content for Claude
    const contentContext = formatContentContext(contentInput);

    // Send to Ollama first (free), fallback to Claude
    console.log('[Stage 4] Sending to Ollama for legal analysis...');
    const { response: claudeResponse, model, cost } = await sendPromptHybrid(
      UTAH_HARM_SYSTEM_PROMPT,
      contentContext,
      4 // stage 4
    );

    if (model === 'ollama') {
      console.log(`[Stage 4] Using Ollama (free)`);
    } else {
      console.log(`[Stage 4] Ollama unavailable, using Claude (cost: $${cost.estimatedCost.toFixed(4)})`);
    }

    // Parse JSON response
    let parsedResponse: UtahStage4Result;
    try {
      let jsonString = claudeResponse.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Stage 4] Failed to parse Claude response as JSON:', claudeResponse.substring(0, 200));
      return {
        url,
        verdict: 'inconclusive',
        confidence: 0,
        stage: 4,
        evidence: ['Claude response parsing failed'],
        detectionMethod: 'content-analysis',
        content_category: 'unknown',
        requires_age_verification: false,
        category_analysis: 'Analysis failed',
        content_assessment: 'Analysis failed',
        reasoning_summary: 'Failed to parse response',
      };
    }

    // Validate response shape
    if (!('verdict' in parsedResponse) || !('confidence' in parsedResponse)) {
      console.error('[Stage 4] Claude response missing required fields:', parsedResponse);
      return {
        url,
        verdict: 'inconclusive',
        confidence: 0,
        stage: 4,
        evidence: ['Invalid Claude response structure'],
        detectionMethod: 'content-analysis',
        content_category: 'unknown',
        requires_age_verification: false,
        category_analysis: 'Invalid response',
        content_assessment: 'Invalid response',
        reasoning_summary: 'Invalid response structure',
      };
    }

    // Convert confidence from 0-1 to 0-100
    const confidence = Math.round((parsedResponse.confidence || 0) * 100);

    console.log(`[Stage 4] Content Classification Result:`);
    console.log(`  Verdict: ${parsedResponse.verdict.toUpperCase()}`);
    console.log(`  Category: ${parsedResponse.content_category}`);
    console.log(`  Confidence: ${confidence}%`);
    console.log(`  Requires Age Verification: ${parsedResponse.requires_age_verification}`);

    return {
      url,
      verdict: parsedResponse.verdict,
      confidence,
      stage: 4,
      evidence: parsedResponse.evidence || [],
      detectionMethod: 'content-analysis',
      content_category: parsedResponse.content_category,
      requires_age_verification: parsedResponse.requires_age_verification,
      category_analysis: parsedResponse.category_analysis,
      content_assessment: parsedResponse.content_assessment,
      reasoning_summary: parsedResponse.reasoning_summary,
      rawResponse: parsedResponse,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Stage 4] Error during content analysis:', errorMsg);

    return {
      url,
      verdict: 'inconclusive',
      confidence: 0,
      stage: 4,
      evidence: [`Stage 4 error: ${errorMsg}`],
      detectionMethod: 'content-analysis',
      content_category: 'unknown',
      requires_age_verification: false,
      category_analysis: 'Error during analysis',
      content_assessment: errorMsg,
      reasoning_summary: `Analysis error: ${errorMsg}`,
    };
  }
}

/**
 * Stage 4 Result type (extends DetectionResult with content category analysis)
 */
export interface Stage4ResultData {
  url: string;
  verdict: 'yes' | 'no' | 'inconclusive';
  confidence: number; // 0-100
  stage: 4;
  evidence: string[];
  detectionMethod: 'content-analysis';
  content_category: 'adult' | 'gambling' | 'alcohol' | 'tobacco' | 'drugs' | 'weapons' | 'services' | 'general' | 'unknown';
  requires_age_verification: boolean;
  category_analysis: string;
  content_assessment: string;
  reasoning_summary: string;
  rawResponse?: unknown;
}
