/**
 * Ollama Local LLM Wrapper
 * Uses locally-running Ollama for cost-free inference
 * Default: assumes Ollama running on localhost:11434
 */

export interface OllamaPromptOptions {
  text: string;
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2'; // Uses your installed llama2 model

/**
 * Send prompt to local Ollama instance
 * @param systemPrompt System instructions
 * @param options User prompt text
 * @returns Model's response text
 */
export async function sendPromptToOllama(
  systemPrompt: string,
  options: OllamaPromptOptions
): Promise<string> {
  const { text: userPrompt } = options;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        temperature: 0.3, // Lower temperature for more consistent analysis
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Ollama request failed: ${errorMsg}`);
  }
}

/**
 * Check if Ollama is available and healthy
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List available models in Ollama
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.models || []).map((m: any) => m.name);
  } catch {
    return [];
  }
}
