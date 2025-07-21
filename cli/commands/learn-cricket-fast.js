/**
 * Learn Cricket Fast Command
 * 
 * Test different speed optimization strategies
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getLearnCricketService } from '../services/LearnCricketService.js';
import { getLearnCricketServiceFast } from '../services/LearnCricketServiceFast.js';

export const learnCricketFastCommand = new Command('learn-cricket-fast')
  .description('Compare speed of different Learn Cricket implementations')
  .option('-m, --mode <mode>', 'Generation mode: original, fast, parallel', 'fast')
  .option('-p, --play', 'Play the game after generation')
  .action(async (options) => {
    console.log(chalk.green('\n🏏 Learn Cricket Speed Test\n'));

    try {
      let questions = [];
      let generationTime = 0;

      if (options.mode === 'original') {
        // Original implementation with Perplexity Sonar
        console.log(chalk.yellow('Using ORIGINAL implementation (Perplexity Sonar)...\n'));
        const service = getLearnCricketService();
        
        const startTime = Date.now();
        questions = await service.generateOverQuestions({ overNumber: 1 });
        generationTime = Date.now() - startTime;
        
      } else if (options.mode === 'parallel') {
        // Parallel generation with GPT-3.5
        console.log(chalk.yellow('Using PARALLEL generation (2x3 questions)...\n'));
        const service = getLearnCricketServiceFast();
        
        const startTime = Date.now();
        questions = await service.generateOverQuestionsParallel({ overNumber: 1 });
        generationTime = Date.now() - startTime;
        
      } else {
        // Fast mode with GPT-3.5
        console.log(chalk.yellow('Using FAST mode (GPT-3.5 Turbo)...\n'));
        const service = getLearnCricketServiceFast();
        
        const startTime = Date.now();
        questions = await service.generateOverQuestions({ 
          overNumber: 1,
          modelPreference: 'fastest' 
        });
        generationTime = Date.now() - startTime;
      }

      // Display results
      console.log(chalk.green(`\n✅ Generated ${questions.length} questions in ${generationTime}ms (${(generationTime/1000).toFixed(1)}s)\n`));
      
      // Show question quality
      console.log(chalk.cyan('Sample Questions:\n'));
      questions.slice(0, 2).forEach((q, i) => {
        console.log(chalk.white(`${i + 1}. ${q.question}`));
        console.log(chalk.gray(`   Topic: ${q.topic}`));
        console.log('');
      });

      // Speed comparison table
      console.log(chalk.yellow('\n📊 Speed Comparison:'));
      console.log(chalk.gray('┌─────────────────┬──────────────┬─────────────┐'));
      console.log(chalk.gray('│ Implementation  │ Model        │ Typical Time│'));
      console.log(chalk.gray('├─────────────────┼──────────────┼─────────────┤'));
      console.log(chalk.gray('│ Original        │ Perplexity   │ 10-15s      │'));
      console.log(chalk.gray('│ Fast            │ GPT-3.5      │ 1-3s        │'));
      console.log(chalk.gray('│ Parallel        │ GPT-3.5 x2   │ 1-2s        │'));
      console.log(chalk.gray('└─────────────────┴──────────────┴─────────────┘'));

      // Test different models
      if (options.mode === 'fast') {
        const { testOthers } = await inquirer.prompt([{
          type: 'confirm',
          name: 'testOthers',
          message: 'Test other models?',
          default: false
        }]);

        if (testOthers) {
          console.log(chalk.cyan('\n🧪 Testing other models...\n'));
          const service = getLearnCricketServiceFast();
          
          // Test free model
          console.log(chalk.gray('Testing Llama 3.1 (free)...'));
          const freeStart = Date.now();
          try {
            await service.generateOverQuestions({ 
              overNumber: 1,
              modelPreference: 'free' 
            });
            const freeTime = Date.now() - freeStart;
            console.log(chalk.green(`✓ Llama 3.1: ${freeTime}ms\n`));
          } catch (e) {
            console.log(chalk.red(`✗ Llama 3.1 failed: ${e.message}\n`));
          }

          // Test Claude Haiku
          console.log(chalk.gray('Testing Claude 3 Haiku...'));
          const haikuStart = Date.now();
          try {
            await service.generateOverQuestions({ 
              overNumber: 1,
              modelPreference: 'balanced' 
            });
            const haikuTime = Date.now() - haikuStart;
            console.log(chalk.green(`✓ Claude Haiku: ${haikuTime}ms\n`));
          } catch (e) {
            console.log(chalk.red(`✗ Claude Haiku failed: ${e.message}\n`));
          }
        }
      }

      // Optionally play the game
      if (options.play && questions.length === 6) {
        console.log(chalk.yellow('\n=== PLAY TEST ===\n'));
        displayQuestions(questions);
        
        const { answers } = await inquirer.prompt([{
          type: 'input',
          name: 'answers',
          message: 'Enter your answers (comma-separated):',
          validate: input => input.split(',').length === 6 || 'Please provide 6 answers'
        }]);

        // Simple scoring
        const userAnswers = answers.toUpperCase().split(',').map(a => a.trim().charCodeAt(0) - 65);
        const correct = questions.reduce((sum, q, i) => sum + (q.correctAnswer === userAnswers[i] ? 1 : 0), 0);
        console.log(chalk.green(`\nScore: ${correct}/6`));
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      process.exit(1);
    }
  });

function displayQuestions(questions) {
  questions.forEach((q, i) => {
    console.log(chalk.white(`\n${i + 1}. ${q.question}`));
    q.options.forEach((opt, j) => {
      console.log(chalk.cyan(`   ${String.fromCharCode(65 + j)}. ${opt}`));
    });
  });
  console.log('');
}