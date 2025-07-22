/**
 * CLI Logger Utility
 * 
 * Centralized logger for CLI commands with chalk formatting
 */

import chalk from 'chalk';

export const logger = {
  info: (msg) => console.log(chalk.blue(msg)),
  warn: (msg) => console.warn(chalk.yellow(msg)),
  error: (msg) => console.error(chalk.red(msg)),
  success: (msg) => console.log(chalk.green(msg)),
  debug: (msg) => console.log(chalk.gray(msg)),
  
  // Special formatting for cricket-specific logs
  cricket: (msg) => console.log(chalk.blue(`🏏 ${msg}`)),
  question: (msg) => console.log(chalk.cyan(`❓ ${msg}`)),
  score: (msg) => console.log(chalk.yellow(`📊 ${msg}`)),
};

export default logger;