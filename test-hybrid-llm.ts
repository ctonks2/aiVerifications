/**
 * Hybrid LLM Cost Optimization Test
 * Demonstrates Ollama + Claude hybrid approach
 */

import { initHybridLLM, sendPromptHybrid, getCostSummary, resetCostTracking } from './src/llm-router';

async function testHybridLLM() {
  console.log('\n' + '='.repeat(100));
  console.log('HYBRID LLM COST OPTIMIZATION TEST');
  console.log('='.repeat(100));
  console.log('Testing Ollama (local/free) + Claude (paid) hybrid approach\n');

  // Initialize hybrid system
  console.log('[Setup] Initializing hybrid LLM system...');
  await initHybridLLM({ preferOllama: true, fallbackToClaude: true });

  resetCostTracking();

  // Example Stage 2 prompts (age gate detection)
  const testPrompts = [
    {
      stage: 2,
      text: `This page contains: "You must be 18+ to continue. Click here to verify your age with our secure ID verification."
             The site has clear age gating with a date of birth form.`,
      description: 'Clear age gate signal',
    },
    {
      stage: 2,
      text: `Example Domain - This domain is for use in documentation examples without needing permission.
             Learn more about domains.`,
      description: 'No age gate (control)',
    },
    {
      stage: 2,
      text: `Welcome to our encyclopedia. Browse articles, upload media, collaborate with our community.
             This page contains information about various topics.`,
      description: 'Educational site (no age gate)',
    },
  ];

  const systemPrompt = `You are analyzing webpage text for age verification gates.
Return JSON: {"hasAgeVerification": true/false, "confidence": 0-1, "evidence": ["..."], "reasoning": "..."}`;

  for (const test of testPrompts) {
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`Test: ${test.description}`);
    console.log(`Stage: ${test.stage}`);
    console.log(`Text sample: "${test.text.substring(0, 80)}..."`);
    console.log('─'.repeat(100));

    try {
      const { response, model, cost } = await sendPromptHybrid(
        systemPrompt,
        test.text,
        test.stage
      );

      console.log(`\nModel Used: ${model.toUpperCase()}`);
      console.log(`Cost: $${cost.estimatedCost.toFixed(4)}`);
      console.log(`Response (first 150 chars): ${response.substring(0, 150)}...`);

      // Try to parse JSON response
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      try {
        const parsed = JSON.parse(jsonStr);
        console.log(`Parsed verdict: ${parsed.hasAgeVerification === true ? 'YES (age gate)' : parsed.hasAgeVerification === false ? 'NO (no gate)' : 'UNCLEAR'}`);
        console.log(`Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
      } catch {
        console.log('(Response not JSON parseable)');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`✗ Error: ${errorMsg}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('COST ANALYSIS');
  console.log('='.repeat(100));

  const summary = getCostSummary();
  console.log(`
Ollama Calls:       ${summary.ollamaCalls} (free)
Claude Calls:       ${summary.claudeCalls} (paid)
Total Cost:         $${summary.totalEstimatedCost.toFixed(4)}
Saved by Ollama:    $${summary.savedByOllama.toFixed(4)}

Estimated savings:  ${summary.ollamaCalls > 0 ? Math.round((summary.savedByOllama / (summary.totalEstimatedCost + summary.savedByOllama)) * 100) : 0}%
  `);

  console.log('='.repeat(100));
  console.log('\n✓ Hybrid LLM test complete');
  console.log('\nWhat to do next:');
  console.log('1. Install Ollama: https://ollama.ai');
  console.log('2. Pull a model: ollama pull mistral');
  console.log('3. Update .env with OLLAMA_BASE_URL and OLLAMA_MODEL');
  console.log('4. Modify src/stages/stage2-dom.ts to use hybrid router');
  console.log('5. See HYBRID_LLM_GUIDE.md for full implementation details');
  console.log('='.repeat(100) + '\n');
}

testHybridLLM().catch(console.error);
