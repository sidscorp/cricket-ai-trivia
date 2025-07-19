#!/usr/bin/env node

/**
 * Cricket Trivia CLI Test Tool
 * 
 * Command-line interface for testing the AI-powered question generation
 * pipeline with Google Custom Search verification.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { generateCommand } from './commands/generate.js';
import { verifyCommand } from './commands/verify.js';
import { pipelineCommand } from './commands/pipeline.js';
import { performanceCommand } from './commands/performance.js';
import { groundedCommand } from './commands/grounded.js';

const program = new Command();

// ASCII Art Header
const header = `
${chalk.green('╔══════════════════════════════════════════════════════════════╗')}
${chalk.green('║')}    ${chalk.bold.yellow('🏏 Cricket Trivia CLI Test Tool')}                    ${chalk.green('║')}
${chalk.green('║')}    ${chalk.cyan('AI-Powered Question Generation Pipeline Testing')}    ${chalk.green('║')}
${chalk.green('╚══════════════════════════════════════════════════════════════╝')}
`;

program
  .name('cricket-cli')
  .description('CLI tool for testing AI-powered cricket question generation with web verification')
  .version('1.0.0')
  .hook('preAction', () => {
    console.log(header);
  });

// Add commands
program.addCommand(generateCommand);
program.addCommand(verifyCommand);
program.addCommand(pipelineCommand);
program.addCommand(performanceCommand);
program.addCommand(groundedCommand);

// Help command override
program.helpCommand('help [command]');

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  console.error(chalk.red('\n❌ Error:'), err.message);
  process.exit(1);
}