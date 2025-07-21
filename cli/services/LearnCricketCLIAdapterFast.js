/**
 * Fast CLI Adapter for Learn Cricket Service
 * 
 * Uses GPT-3.5 for faster response times.
 */

import chalk from 'chalk';
import LearnCricketService from '../../shared/services/LearnCricketService.js';
import { getOpenRouterService } from './OpenRouterService.js';
import { AI_MODELS } from '../../shared/config/ai-models.js';

// Create logger with chalk for CLI
const cliLogger = {
  info: (msg) => console.log(chalk.blue(`🏏 ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠️  ${msg}`)),
  error: (msg, error) => console.error(chalk.red(`❌ ${msg}`), error || ''),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
};

/**
 * Get Learn Cricket service with specific model preference
 */
export function getLearnCricketServiceWithModel(modelPreference = 'fast') {
  const openRouterService = getOpenRouterService();
  const model = AI_MODELS.learn_cricket[modelPreference] || AI_MODELS.learn_cricket.fast;
  
  console.log(chalk.gray(`   Using model: ${model}`));
  
  return new LearnCricketService({
    logger: cliLogger,
    openRouterService: openRouterService,
    model: model,
  });
}

export default getLearnCricketServiceWithModel;