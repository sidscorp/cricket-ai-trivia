/**
 * Shared AI Model Configuration
 * 
 * Centralized configuration for AI models used across CLI and UI.
 * Change models here to affect both environments.
 */

export const AI_MODELS = {
  // Available models for different use cases
  learn_cricket: {
    // Default model for Learn Cricket mode
    default: 'openai/gpt-3.5-turbo',
    
    // Alternative models
    fast: 'openai/gpt-3.5-turbo',
    quality: 'perplexity/sonar',
    free: 'meta-llama/llama-3.1-8b-instruct:free',
    balanced: 'anthropic/claude-3-haiku',
  },
  
  // Models for other game modes (future use)
  trivia_game: {
    default: 'openai/gpt-4-turbo',
    fast: 'openai/gpt-3.5-turbo',
  },
  
  // Search-capable models for V2 pipeline
  search: {
    default: 'perplexity/sonar',
    pro: 'perplexity/sonar-pro',
  }
};

// Model performance characteristics
export const MODEL_SPECS = {
  'openai/gpt-3.5-turbo': {
    speed: 'fast',
    cost: 'low',
    quality: 'good',
    avgResponseTime: '1-3s',
    supportsSearch: false,
  },
  'perplexity/sonar': {
    speed: 'medium',
    cost: 'medium',
    quality: 'excellent',
    avgResponseTime: '5-10s',
    supportsSearch: true,
  },
  'meta-llama/llama-3.1-8b-instruct:free': {
    speed: 'fast',
    cost: 'free',
    quality: 'good',
    avgResponseTime: '1-3s',
    supportsSearch: false,
  },
  'anthropic/claude-3-haiku': {
    speed: 'fast',
    cost: 'low',
    quality: 'very_good',
    avgResponseTime: '1-2s',
    supportsSearch: false,
  }
};

// Get model from environment or use default
export function getLearnCricketModel() {
  // Check environment variable (works for both CLI and UI)
  const envModel = process.env.LEARN_CRICKET_MODEL || 
                   process.env.EXPO_PUBLIC_LEARN_CRICKET_MODEL;
  
  if (envModel && AI_MODELS.learn_cricket[envModel]) {
    return AI_MODELS.learn_cricket[envModel];
  }
  
  return AI_MODELS.learn_cricket.default;
}

// Token limits for different models
export const TOKEN_LIMITS = {
  'openai/gpt-3.5-turbo': 1500,
  'perplexity/sonar': 3000,
  'meta-llama/llama-3.1-8b-instruct:free': 1000,
  'anthropic/claude-3-haiku': 2000,
};

export default {
  AI_MODELS,
  MODEL_SPECS,
  getLearnCricketModel,
  TOKEN_LIMITS,
};