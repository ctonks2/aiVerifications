/**
 * Hybrid LLM Router
 * Intelligently routes requests between Ollama (free) and Claude (paid)
 * Minimizes API costs by using Ollama for initial analysis, escalating to Claude when needed
 */

import { sendPromptToClaude, ClaudePromptOptions } from './claude';
import { sendPromptToOllama, isOllamaAvailable } from './ollama';

export interface HybridLLMConfig {
  preferOllama?: boolean; // Try Ollama first?
  fallbackToClaude?: boolean; // Fall back to Claude if Ollama fails?
  costTracking?: boolean; // Log cost estimates?
}

export interface LLMCostEstimate {
  model: 'ollama' | 'claude';
  estimatedCost: number;
  tokensUsed?: number;
}

let ollamaHealthy: boolean | null = null;
let costTracker: LLMCostEstimate[] = [];

/**
 * Initialize hybrid LLM system
 */
export async function initHybridLLM(config: HybridLLMConfig = {}): Promise<void> {
  if (config.preferOllama !== false) {
    // Check if Ollama is available
    ollamaHealthy = await isOllamaAvailable();
    if (ollamaHealthy) {
      console.log('[Hybrid LLM] ✓ Ollama available - will use for cost savings');
    } else {
      console.log('[Hybrid LLM] ✗ Ollama unavailable - will use Claude only');
    }
  }
}

/**
 * Send prompt with intelligent model selection
 * Stage 2/4 can use Ollama for initial analysis, escalate to Claude if needed
 */
export async function sendPromptHybrid(
  systemPrompt: string,
  userPrompt: string | ClaudePromptOptions,
  stage: number,
  config: HybridLLMConfig = {}
): Promise<{ response: string; model: 'ollama' | 'claude'; cost: LLMCostEstimate }> {
  const useOllama = config.preferOllama !== false && ollamaHealthy;
  const fallbackToClaude = config.fallbackToClaude !== false;

  // For vision analysis (Stage 3), always use Claude
  if (stage === 3 && typeof userPrompt === 'object' && userPrompt.imageBase64) {
    return sendUsingClaude(systemPrompt, userPrompt);
  }

  // For Stage 2 and early Stage 4, try Ollama first
  if (useOllama && (stage === 2 || stage === 4)) {
    try {
      console.log(`[Hybrid LLM] Using Ollama for Stage ${stage} analysis...`);
      const text = typeof userPrompt === 'string' ? userPrompt : userPrompt.text;
      const response = await sendPromptToOllama(systemPrompt, { text });

      const cost: LLMCostEstimate = { model: 'ollama', estimatedCost: 0 };
      trackCost(cost);

      return { response, model: 'ollama', cost };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[Hybrid LLM] Ollama failed: ${errorMsg}`);

      if (!fallbackToClaude) {
        throw error;
      }
      console.log('[Hybrid LLM] Falling back to Claude...');
    }
  }

  // Default to Claude
  return sendUsingClaude(systemPrompt, userPrompt);
}

/**
 * Send using Claude API
 */
async function sendUsingClaude(
  systemPrompt: string,
  userPrompt: string | ClaudePromptOptions
): Promise<{ response: string; model: 'claude'; cost: LLMCostEstimate }> {
  const response = await sendPromptToClaude(systemPrompt, 
    typeof userPrompt === 'string' ? { text: userPrompt } : userPrompt
  );

  // Rough token estimate for cost calculation
  // Claude 3 v1: $0.003 per 1K input tokens, $0.015 per 1K output tokens
  const estimatedInputTokens = (typeof userPrompt === 'string' ? userPrompt : userPrompt.text).length / 4;
  const estimatedOutputTokens = response.length / 4;
  const estimatedCost = (estimatedInputTokens * 0.003 + estimatedOutputTokens * 0.015) / 1000;

  const cost: LLMCostEstimate = {
    model: 'claude',
    estimatedCost,
    tokensUsed: estimatedInputTokens + estimatedOutputTokens,
  };
  trackCost(cost);

  return { response, model: 'claude', cost };
}

/**
 * Track costs for reporting
 */
function trackCost(cost: LLMCostEstimate): void {
  costTracker.push(cost);
}

/**
 * Get cost summary
 */
export function getCostSummary(): {
  totalEstimatedCost: number;
  ollamaCalls: number;
  claudeCalls: number;
  savedByOllama: number;
} {
  const ollamaCalls = costTracker.filter((c) => c.model === 'ollama').length;
  const claudeCalls = costTracker.filter((c) => c.model === 'claude').length;
  const totalEstimatedCost = costTracker.reduce((sum, c) => sum + c.estimatedCost, 0);

  // If those Ollama calls had been Claude, they'd each cost ~$0.01
  const savedByOllama = ollamaCalls * 0.01;

  return {
    totalEstimatedCost,
    ollamaCalls,
    claudeCalls,
    savedByOllama,
  };
}

/**
 * Reset cost tracking
 */
export function resetCostTracking(): void {
  costTracker = [];
}
