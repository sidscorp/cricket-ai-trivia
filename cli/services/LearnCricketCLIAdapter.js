/**
 * CLI Adapter for Learn Cricket Service
 * 
 * Wraps the shared LearnCricketService with CLI-specific features like chalk logging.
 */

import chalk from 'chalk';
import LearnCricketService from '../../shared/services/LearnCricketService.js';
import { getOpenRouterService } from './OpenRouterService.js';

// Create logger with chalk for CLI
const cliLogger = {
  info: (msg) => console.log(chalk.blue(`🏏 ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠️  ${msg}`)),
  error: (msg, error) => console.error(chalk.red(`❌ ${msg}`), error || ''),
  success: (msg) => console.log(chalk.green(`✅ ${msg}`)),
};

/**
 * Get Learn Cricket service configured for CLI
 */
export function getLearnCricketService() {
  const openRouterService = getOpenRouterService();
  
  return new LearnCricketService({
    logger: cliLogger,
    openRouterService: openRouterService,
    // Model can be overridden by environment variable
  });
}

export default getLearnCricketService;