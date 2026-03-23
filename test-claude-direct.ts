/**
 * Direct Claude API Test
 * Tests if the API key and credits are working
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from './src/config';

async function testClaudeAPI() {
  console.log('\n' + '='.repeat(80));
  console.log('DIRECT CLAUDE API TEST');
  console.log('='.repeat(80));

  if (!config.anthropic.apiKey) {
    console.error('✗ ANTHROPIC_API_KEY not found in .env file');
    return;
  }

  console.log(`API Key loaded: ${config.anthropic.apiKey.slice(0, 20)}...`);
  console.log(`API Key length: ${config.anthropic.apiKey.length} characters\n`);

  const client = new Anthropic({
    apiKey: config.anthropic.apiKey,
  });

  console.log('Sending simple test prompt to Claude...\n');

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Respond with just: "API is working"',
        },
      ],
    });

    console.log('✓ SUCCESS - Claude API is working!');
    console.log('\nResponse from Claude:');
    const textContent = message.content.find((c) => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(`  "${textContent.text}"`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('API Configuration is correct. Credits appear to be available.');
    console.log('='.repeat(80) + '\n');
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`✗ CLAUDE API ERROR: ${error.message}`);
      console.error(`Status: ${error.status}`);
      console.error(`Type: ${error.type}`);

      console.log('\n' + '='.repeat(80));
      console.log('TROUBLESHOOTING:');
      console.log('='.repeat(80));

      if (error.message.includes('credit')) {
        console.log('Issue: Credit balance is too low');
        console.log('Action: Go to https://console.anthropic.com/ and check:');
        console.log('  1. Plans & Billing - add more credits');
        console.log('  2. Verify the API key is from the same account');
        console.log('  3. Check if billing is enabled for the project');
      } else if (error.message.includes('invalid_api_key')) {
        console.log('Issue: API key is invalid or expired');
        console.log('Action: Generate a new API key from console.anthropic.com');
      } else if (error.message.includes('rate_limit')) {
        console.log('Issue: Rate limit exceeded');
        console.log('Action: Wait a moment and try again');
      }

      console.log('='.repeat(80) + '\n');
    } else {
      console.error(`✗ UNEXPECTED ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

testClaudeAPI().catch(console.error);
