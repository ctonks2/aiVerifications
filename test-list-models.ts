/**
 * List available models for this API key
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from './src/config';

async function listAvailableModels() {
  console.log('\n' + '='.repeat(80));
  console.log('ANTHROPIC MODEL AVAILABILITY CHECK');
  console.log('='.repeat(80) + '\n');

  const modelsToTry = [
    'claude-opus-20250219',
    'claude-sonnet-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
    'claude-opus',
    'claude-sonnet',
    'claude-haiku',
    'claude-instant-1.3',
  ];

  console.log('Testing which models are available...\n');

  const client = new Anthropic({
    apiKey: config.anthropic.apiKey,
  });

  for (const model of modelsToTry) {
    try {
      const message = await client.messages.create({
        model: model,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'test',
          },
        ],
      });

      console.log(`✓ ${model} - AVAILABLE`);
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        if (error.message.includes('not_found')) {
          console.log(`✗ ${model} - NOT FOUND`);
        } else if (error.message.includes('credit')) {
          console.log(`⚠ ${model} - NO CREDITS`);
        } else {
          console.log(`✗ ${model} - ERROR: ${error.message.substring(0, 60)}`);
        }
      }
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(80));
  console.log('NEXT STEPS:');
  console.log('='.repeat(80));
  console.log('1. Note which models are available above');
  console.log('2. Update src/claude.ts to use an AVAILABLE model');
  console.log('3. Update line: model: "YOUR_AVAILABLE_MODEL"');
  console.log('='.repeat(80) + '\n');
}

listAvailableModels().catch(console.error);
