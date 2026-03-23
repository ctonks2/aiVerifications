/**
 * Minimal Claude API test with simple model names
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from './src/config';

async function testMinimal() {
  console.log('Testing Claude API with minimal setup...\n');

  const client = new Anthropic({
    apiKey: config.anthropic.apiKey,
  });

  const simpleModes = [
    'claude-opus-4-1',
    'claude-opus-4',
    'claude-opus',
    'claude-sonnet-4',
    'claude-sonnet',
    'claude-3',
    'claude',
    'gpt-4',
  ];

  for (const modelName of simpleModes) {
    try {
      console.log(`Trying: ${modelName}...`);
      const message = await client.messages.create({
        model: modelName,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'hi',
          },
        ],
      });
      console.log(`✓ SUCCESS WITH: ${modelName}\n`);
      console.log('Full response:');
      console.log(JSON.stringify(message, null, 2));
      return;
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        const msg = error.message.substring(0, 50);
        console.log(`  ✗ ${msg}...\n`);
      }
    }
  }

  console.log('No models worked. Trying to get account info...');
}

testMinimal().catch(console.error);
