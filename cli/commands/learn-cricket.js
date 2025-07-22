/**
 * Learn Cricket Command
 * 
 * CLI command for testing cricket basics question generation.
 * Uses batch approach: generates 6 questions, collects answers, then adapts.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import LearnCricketService from '../../shared/services/LearnCricketService.js';
import { getOpenRouterService } from '../../shared/services/OpenRouterService.js';
import { logger } from '../utils/logger.js';

export const learnCricketCommand = new Command('learn-cricket')
  .description('Test adaptive cricket learning questions in batch mode')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    console.log(chalk.green('\n🏏 Welcome to Learn Cricket - Batch Testing Mode\n'));
    console.log(chalk.cyan('This tool tests AI-generated cricket questions for beginners.'));
    console.log(chalk.cyan('You\'ll see 6 questions per over, answer all at once.\n'));

    try {
      const service = new LearnCricketService({
        logger: logger,
        openRouterService: getOpenRouterService()
      });
      let allQuestions = [];
      let allAnswers = [];

      // Over 1
      console.log(chalk.yellow('\n=== OVER 1 ===\n'));
      const over1Questions = await service.generateOverQuestions({
        overNumber: 1
      });
      
      displayQuestions(over1Questions, options.verbose);
      
      const over1Input = await collectAnswers(1);
      const over1Answers = service.parseUserAnswers(over1Input);
      
      const over1Performance = service.calculatePerformance(over1Questions, over1Answers);
      displayOverResults(1, over1Questions, over1Answers, over1Performance);
      
      allQuestions.push(...over1Questions);
      allAnswers.push(...over1Answers);

      // Ask if user wants to continue to Over 2
      const { continueToOver2 } = await inquirer.prompt([{
        type: 'confirm',
        name: 'continueToOver2',
        message: 'Continue to Over 2?',
        default: true
      }]);

      if (continueToOver2) {
        // Over 2
        console.log(chalk.yellow('\n=== OVER 2 ===\n'));
        console.log(chalk.gray('Generating adaptive questions based on your performance...\n'));
        
        const over2Questions = await service.generateOverQuestions({
          overNumber: 2,
          previousQuestions: over1Questions,
          previousAnswers: over1Answers,
          performance: over1Performance
        });
        
        displayQuestions(over2Questions, options.verbose);
        
        const over2Input = await collectAnswers(2);
        const over2Answers = service.parseUserAnswers(over2Input);
        
        const over2Performance = service.calculatePerformance(over2Questions, over2Answers);
        displayOverResults(2, over2Questions, over2Answers, over2Performance);
        
        allQuestions.push(...over2Questions);
        allAnswers.push(...over2Answers);
      }

      // Final Summary
      displayFinalSummary(allQuestions, allAnswers);

    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error.message);
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });

/**
 * Display questions for an over
 */
function displayQuestions(questions, verbose = false) {
  questions.forEach((q, i) => {
    console.log(chalk.white(`\n${i + 1}. ${q.question}`));
    if (verbose && q.topic) {
      console.log(chalk.gray(`   [Topic: ${q.topic}]`));
    }
    q.options.forEach((opt, j) => {
      console.log(chalk.cyan(`   ${String.fromCharCode(65 + j)}. ${opt}`));
    });
  });
  console.log('');
}

/**
 * Collect answers for an over
 */
async function collectAnswers(overNumber) {
  const { answers } = await inquirer.prompt([{
    type: 'input',
    name: 'answers',
    message: `Enter your answers for Over ${overNumber} (comma-separated, e.g., A,B,C,D,A,B):`,
    validate: (input) => {
      const parts = input.split(',').map(a => a.trim());
      if (parts.length !== 6) {
        return 'Please provide exactly 6 answers';
      }
      const valid = parts.every(a => /^[A-Da-d]$/.test(a));
      if (!valid) {
        return 'Answers must be A, B, C, or D';
      }
      return true;
    }
  }]);
  return answers;
}

/**
 * Display results for an over
 */
function displayOverResults(overNumber, questions, userAnswers, performance) {
  console.log(chalk.yellow(`\n--- Over ${overNumber} Results ---`));
  console.log(chalk.white(`Score: ${performance.correct}/6 (${Math.round(performance.accuracy * 100)}%)\n`));
  
  questions.forEach((q, i) => {
    const userAnswer = userAnswers[i];
    const isCorrect = userAnswer === q.correctAnswer;
    const icon = isCorrect ? '✓' : '✗';
    const color = isCorrect ? chalk.green : chalk.red;
    
    console.log(color(`${icon} Question ${i + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`));
    
    if (!isCorrect && userAnswer >= 0) {
      console.log(chalk.gray(`   Your answer: ${String.fromCharCode(65 + userAnswer)}`));
      console.log(chalk.gray(`   Correct answer: ${String.fromCharCode(65 + q.correctAnswer)}`));
    }
    
    console.log(chalk.cyan(`   Explanation: ${q.explanation}\n`));
  });

  if (performance.correctTopics.length > 0) {
    console.log(chalk.green(`Strong topics: ${performance.correctTopics.join(', ')}`));
  }
  if (performance.incorrectTopics.length > 0) {
    console.log(chalk.yellow(`Topics to review: ${performance.incorrectTopics.join(', ')}`));
  }
}

/**
 * Display final summary
 */
function displayFinalSummary(allQuestions, allAnswers) {
  console.log(chalk.yellow('\n=== FINAL SUMMARY ===\n'));
  
  const totalCorrect = allQuestions.reduce((sum, q, i) => {
    return sum + (q.correctAnswer === allAnswers[i] ? 1 : 0);
  }, 0);
  
  const totalQuestions = allQuestions.length;
  const accuracy = (totalCorrect / totalQuestions * 100).toFixed(1);
  
  console.log(chalk.white(`Total Score: ${totalCorrect}/${totalQuestions} (${accuracy}%)`));
  
  // Topic analysis
  const topicStats = {};
  allQuestions.forEach((q, i) => {
    const topic = q.topic || 'general';
    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 };
    }
    topicStats[topic].total++;
    if (q.correctAnswer === allAnswers[i]) {
      topicStats[topic].correct++;
    }
  });
  
  console.log(chalk.white('\nPerformance by Topic:'));
  Object.entries(topicStats).forEach(([topic, stats]) => {
    const topicAccuracy = (stats.correct / stats.total * 100).toFixed(0);
    const color = topicAccuracy >= 70 ? chalk.green : topicAccuracy >= 50 ? chalk.yellow : chalk.red;
    console.log(color(`  ${topic}: ${stats.correct}/${stats.total} (${topicAccuracy}%)`));
  });
  
  console.log(chalk.cyan('\n📊 This data helps us improve question quality and adaptation.'));
  console.log(chalk.cyan('The same AI logic will power the Learn Cricket mode in the app!\n'));
}