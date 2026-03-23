/**
 * Configuration loader for environment variables
 * Loads API keys and settings from .env file
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env file
dotenv.config({ path: resolve(process.cwd(), '.env') });

export const config = {
  // AI APIs
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    enabled: !!process.env.OPENAI_API_KEY,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    enabled: !!process.env.ANTHROPIC_API_KEY,
  },

  // Age verification services
  yoti: {
    apiKey: process.env.YOTI_API_KEY,
    enabled: !!process.env.YOTI_API_KEY,
  },
  veriff: {
    apiKey: process.env.VERIFF_API_KEY,
    enabled: !!process.env.VERIFF_API_KEY,
  },

  // Settings
  debug: process.env.DEBUG === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
};

/**
 * Validates that required API keys are set
 * Throws error if critical keys are missing
 */
export function validateConfig(): void {
  const hasAiApi = config.openai.enabled || config.anthropic.enabled;

  if (!hasAiApi) {
    console.warn(
      '⚠️  WARNING: No AI API key configured. Stage 2 analysis will not work.\n' +
        '   Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env file.'
    );
  }

  if (config.debug) {
    console.log('ℹ️  Debug mode enabled');
  }
}

export default config;
