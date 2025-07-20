/**
 * Generate Command
 * 
 * Test AI-powered cricket incident and question generation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { EnhancedGeminiService } from '../services/archived/enhanced-gemini.js';
import { PerformanceMonitor } from '../utils/performance.js';

export const generateCommand = new Command('generate')
  .description('Test cricket incident and question generation')
  .option('-t, --type <type>', 'Generation type (incident|question)', 'incident')
  .option('-e, --era <era>', 'Cricket era filter', 'all_eras')
  .option('-c, --country <country>', 'Country filter', 'all_countries')
  .option('-d, --difficulty <difficulty>', 'Difficulty level', 'medium')
  .option('-i, --interactive', 'Interactive mode with prompts')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🎲 Cricket Generation Test'));
      console.log(chalk.blue('═══════════════════════════'));

      let generationOptions = {
        era: options.era,
        country: options.country,
        difficulty: options.difficulty
      };

      // Interactive mode
      if (options.interactive) {
        generationOptions = await getInteractiveOptions();
      }

      const geminiService = new EnhancedGeminiService();
      const monitor = new PerformanceMonitor();

      if (options.type === 'incident') {
        await generateIncident(geminiService, generationOptions, monitor, options.json);
      } else if (options.type === 'question') {
        await generateQuestion(geminiService, generationOptions, monitor, options.json);
      } else {
        console.error(chalk.red('❌ Invalid type. Use "incident" or "question"'));
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Generation failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Generate cricket incident
 */
async function generateIncident(geminiService, options, monitor, jsonOutput) {
  monitor.start('Cricket Incident Generation');
  
  try {
    monitor.step('Preparing generation request');
    const incident = await geminiService.generateIncident(options);
    monitor.step('Incident generated successfully');
    
    const metrics = monitor.end();

    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        incident: incident,
        performance: metrics,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      displayIncidentResults(incident, metrics);
    }

  } catch (error) {
    monitor.end();
    throw error;
  }
}

/**
 * Generate cricket question (requires incident first)
 */
async function generateQuestion(geminiService, options, monitor, jsonOutput) {
  monitor.start('Cricket Question Generation');
  
  try {
    // First generate an incident
    monitor.step('Generating base incident');
    const incident = await geminiService.generateIncident(options);
    
    monitor.step('Generating question from incident');
    const question = await geminiService.generateVerifiableQuestion({
      incident: incident,
      difficulty: options.difficulty
    });
    monitor.step('Question generated successfully');
    
    const metrics = monitor.end();

    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        incident: incident,
        question: question,
        performance: metrics,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      displayQuestionResults(incident, question, metrics);
    }

  } catch (error) {
    monitor.end();
    throw error;
  }
}

/**
 * Get options through interactive prompts
 */
async function getInteractiveOptions() {
  console.log(chalk.cyan('\n📋 Interactive Generation Setup'));
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'era',
      message: 'Select cricket era:',
      choices: [
        { name: 'All Eras', value: 'all_eras' },
        { name: 'Golden Age (Pre-1950s)', value: 'golden_age' },
        { name: 'Post-War Boom (1950s-1970s)', value: 'post_war_boom' },
        { name: 'World Cup Era (1970s-1990s)', value: 'world_cup_era' },
        { name: 'Modern Era (2000s-2010s)', value: 'modern_era' },
        { name: 'Contemporary (2010s-2019)', value: 'contemporary' },
        { name: 'Post-COVID (2020-Present)', value: 'post_covid' }
      ]
    },
    {
      type: 'list',
      name: 'country',
      message: 'Select country focus:',
      choices: [
        { name: 'All Countries', value: 'all_countries' },
        { name: 'England', value: 'england' },
        { name: 'Australia', value: 'australia' },
        { name: 'India', value: 'india' },
        { name: 'West Indies', value: 'west_indies' },
        { name: 'Pakistan', value: 'pakistan' },
        { name: 'South Africa', value: 'south_africa' }
      ]
    },
    {
      type: 'list',
      name: 'difficulty',
      message: 'Select difficulty level:',
      choices: [
        { name: 'Easy - Basic facts', value: 'easy' },
        { name: 'Medium - Specific details', value: 'medium' },
        { name: 'Hard - Precise details', value: 'hard' }
      ]
    },
    {
      type: 'list',
      name: 'category',
      message: 'Select category:',
      choices: [
        { name: 'Legendary Moments', value: 'legendary_moments' },
        { name: 'Player Stories', value: 'player_stories' },
        { name: 'Records & Stats', value: 'records_stats' },
        { name: 'Rules & Formats', value: 'rules_formats' },
        { name: 'Cultural Impact', value: 'cultural_impact' }
      ]
    }
  ]);

  return answers;
}

/**
 * Display incident generation results
 */
function displayIncidentResults(incident, metrics) {
  console.log(chalk.green('\n✅ Incident Generated Successfully!'));
  console.log(chalk.blue('\n📖 Cricket Incident:'));
  console.log(chalk.blue('═══════════════════'));
  
  console.log(chalk.white('\n📝 Summary:'));
  console.log(`   ${chalk.cyan(incident.summary)}`);
  
  console.log(chalk.white('\n📖 Full Incident:'));
  console.log(`   ${chalk.gray(incident.incident)}`);
  
  console.log(chalk.white('\n🔍 Search Terms:'));
  incident.searchTerms.forEach(term => {
    console.log(`   • ${chalk.yellow(term)}`);
  });
  
  console.log(chalk.white('\n✅ Verifiable Facts:'));
  incident.facts.forEach((fact, index) => {
    console.log(`   ${index + 1}. ${chalk.green(fact)}`);
  });
  
  if (incident.expectedSources) {
    console.log(chalk.white('\n🌐 Expected Sources:'));
    incident.expectedSources.forEach(source => {
      console.log(`   • ${chalk.blue(source)}`);
    });
  }
}

/**
 * Display question generation results
 */
function displayQuestionResults(incident, question, metrics) {
  console.log(chalk.green('\n✅ Question Generated Successfully!'));
  console.log(chalk.blue('\n📖 Base Incident:'));
  console.log(chalk.blue('═══════════════════'));
  console.log(`   ${chalk.gray(incident.summary)}`);
  
  console.log(chalk.blue('\n❓ Generated Question:'));
  console.log(chalk.blue('══════════════════════'));
  
  console.log(chalk.white('\n📝 Topic:'));
  console.log(`   ${chalk.cyan(question.topic)}`);
  
  console.log(chalk.white('\n❓ Question:'));
  console.log(`   ${chalk.white(question.question)}`);
  
  console.log(chalk.white('\n📋 Options:'));
  question.options.forEach((option, index) => {
    const marker = index === question.correctAnswer ? chalk.green('✓') : chalk.gray('○');
    const color = index === question.correctAnswer ? chalk.green : chalk.white;
    console.log(`   ${marker} ${color(option)}`);
  });
  
  console.log(chalk.white('\n💡 Explanation:'));
  console.log(`   ${chalk.gray(question.explanation)}`);
  
  if (question.verificationPoints) {
    console.log(chalk.white('\n🔍 Verification Points:'));
    question.verificationPoints.forEach((point, index) => {
      console.log(`   ${index + 1}. ${chalk.yellow(point)}`);
    });
  }
  
  if (question.searchHints) {
    console.log(chalk.white('\n🔎 Search Hints:'));
    question.searchHints.forEach(hint => {
      console.log(`   • ${chalk.cyan(hint)}`);
    });
  }
}