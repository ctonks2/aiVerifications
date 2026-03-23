/**
 * Quick Ollama Setup Verification
 * Checks if Ollama is running, lists models, and tests a simple inference
 */

import { isOllamaAvailable, listOllamaModels, sendPromptToOllama } from './src/ollama';

async function verifyOllamaSetup() {
  console.log('\n' + '='.repeat(100));
  console.log('OLLAMA SETUP VERIFICATION');
  console.log('='.repeat(100) + '\n');

  try {
    // Check if Ollama is running
    console.log('[1/4] Checking if Ollama is running...');
    const isAvailable = await isOllamaAvailable();
    
    if (!isAvailable) {
      console.log('✗ Ollama is NOT running!');
      console.log('\nTo fix:');
      console.log('  1. Make sure Ollama is installed: https://ollama.ai');
      console.log('  2. Start Ollama: ollama serve');
      console.log('  3. Run this test again\n');
      return;
    }
    console.log('✓ Ollama is running at http://localhost:11434\n');

    // List available models
    console.log('[2/4] Listing available models...');
    const models = await listOllamaModels();
    
    if (models.length === 0) {
      console.log('✗ No models found in Ollama!');
      console.log('\nTo fix:');
      console.log('  1. Pull a model: ollama pull mistral');
      console.log('  2. Wait for download to complete');
      console.log('  3. Run this test again\n');
      return;
    }

    console.log(`✓ Found ${models.length} model(s):`);
    models.forEach((model) => console.log(`  • ${model}`));
    console.log();

    // Get the first model or use default
    const modelToTest = process.env.OLLAMA_MODEL || models[0];
    console.log(`[3/4] Testing inference with: ${modelToTest}`);
    
    const testPrompt = 'This page says: "You must be 18+ to enter." Is there age verification? Answer with just: YES or NO';
    const response = await sendPromptToOllama(
      'You are a text analyzer. Respond concisely.',
      { text: testPrompt }
    );

    console.log(`✓ Inference successful!\n  Response: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}\n`);

    // Summary
    console.log('[4/4] Setup verification complete!\n');
    console.log('='.repeat(100));
    console.log('✓ OLLAMA IS READY FOR HYBRID LLM');
    console.log('='.repeat(100));
    console.log(`
Next steps:
  1. Update src/stages/stage2-dom.ts to use hybrid router
  2. Run test-hybrid-llm.ts to see cost savings
  3. Monitor costs with: getCostSummary() from llm-router.ts

Configuration loaded:
  • OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}
  • OLLAMA_MODEL: ${process.env.OLLAMA_MODEL || 'mistral'}
  • USE_HYBRID_LLM: ${process.env.USE_HYBRID_LLM || 'true'}
    `);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n✗ Error: ${errorMsg}\n`);

    console.log('Troubleshooting:');
    console.log('  1. Is Ollama running? Run: ollama serve');
    console.log('  2. Do you have a model? Run: ollama pull mistral');
    console.log('  3. Wrong port? Update .env OLLAMA_BASE_URL\n');
  }
}

verifyOllamaSetup().catch(console.error);
