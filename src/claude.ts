/**
 * Anthropic Claude client wrapper
 * Handles API calls with support for text and images
 * Reusable across all stages that need Claude analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';

let anthropic: Anthropic | null = null;

/**
 * Initialize Claude client (singleton pattern)
 */
function getClient(): Anthropic {
  if (!anthropic) {
    if (!config.anthropic.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set in .env file');
    }
    anthropic = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }
  return anthropic;
}

export interface ClaudePromptOptions {
  text: string;
  imageBase64?: string;
  imageMediaType?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

/**
 * Send a prompt to Claude with optional image
 * @param systemPrompt System-level instructions
 * @param userPrompt The user's message (text and/or image)
 * @returns Claude's response text
 */
export async function sendPromptToClaude(
  systemPrompt: string,
  userPrompt: ClaudePromptOptions
): Promise<string> {
  const client = getClient();

  // Build content array based on what's provided
  const content: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: userPrompt.text,
    },
  ];

  // Add image if provided (for Stage 3)
  if (userPrompt.imageBase64) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: userPrompt.imageMediaType || 'image/png',
        data: userPrompt.imageBase64,
      },
    } as Anthropic.ImageBlockParam);
  }

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: content as Anthropic.ContentBlockParam[],
        },
      ],
    });

    // Extract text from response
    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    return textContent.text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error: ${error.message} (${error.status})`);
    }
    throw error;
  }
}

/**
 * Specifically for Stage 2: Text-only analysis
 */
export async function analyzeTextWithClaude(
  systemPrompt: string,
  text: string
): Promise<string> {
  return sendPromptToClaude(systemPrompt, { text });
}

export default getClient;
