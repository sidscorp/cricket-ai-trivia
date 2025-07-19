/**
 * Grounded Command
 * 
 * Test the new Gemini web search grounding for cricket trivia generation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { GroundedGeminiService } from '../services/grounded-gemini.js';
import { PerformanceMonitor } from '../utils/performance.js';
import { URLResolver } from '../utils/url-resolver.js';

export const groundedCommand = new Command('grounded')
  .description('Test Gemini web search grounding for cricket trivia')
  .option('-t, --type <type>', 'Generation type (incident|question)', 'incident')
  .option('-e, --era <era>', 'Cricket era filter', 'all_eras')
  .option('-c, --country <country>', 'Country filter', 'all_countries')
  .option('-d, --difficulty <difficulty>', 'Difficulty level', 'medium')
  .option('--topic <topic>', 'Specific topic to search for')
  .option('-i, --interactive', 'Interactive mode with prompts')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🌐 Grounded Cricket Generation Test'));
      console.log(chalk.blue('════════════════════════════════════'));
      console.log(chalk.cyan('Using Gemini\'s native web search grounding (Oct 2024)'));

      let generationOptions = {
        era: options.era,
        country: options.country,
        difficulty: options.difficulty,
        topic: options.topic
      };

      // Interactive mode
      if (options.interactive) {
        generationOptions = await getInteractiveOptions();
      }

      const geminiService = new GroundedGeminiService();
      const monitor = new PerformanceMonitor();

      if (options.type === 'incident') {
        await generateGroundedIncident(geminiService, generationOptions, monitor, options.json);
      } else if (options.type === 'question') {
        await generateGroundedQuestion(geminiService, generationOptions, monitor, options.json);
      } else {
        console.error(chalk.red('❌ Invalid type. Use "incident" or "question"'));
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Grounded generation failed:'), error.message);
      
      if (error.message.includes('400') || error.message.includes('billing')) {
        console.error(chalk.yellow('\n💡 Possible issues:'));
        console.error(chalk.gray('   • Google Search grounding requires paid Gemini API tier'));
        console.error(chalk.gray('   • Check your billing settings in Google AI Studio'));
        console.error(chalk.gray('   • Ensure your API key has grounding permissions'));
      }
      
      process.exit(1);
    }
  });

/**
 * Generate web-grounded cricket incident
 */
async function generateGroundedIncident(geminiService, options, monitor, jsonOutput) {
  monitor.start('Grounded Cricket Incident Generation');
  
  try {
    monitor.step('Preparing web-grounded request');
    const incident = await geminiService.generateVerifiedIncident(options);
    monitor.step('Web-verified incident generated');
    
    const metrics = monitor.end();

    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        incident: incident,
        grounding: incident.grounding,
        performance: metrics,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      await displayGroundedIncidentResults(incident, metrics);
    }

  } catch (error) {
    monitor.end();
    throw error;
  }
}

/**
 * Generate web-grounded cricket question
 */
async function generateGroundedQuestion(geminiService, options, monitor, jsonOutput) {
  monitor.start('Grounded Cricket Question Generation');
  
  try {
    monitor.step('Preparing web-grounded request');
    const question = await geminiService.generateVerifiedQuestion(options);
    monitor.step('Web-verified question generated');
    
    const metrics = monitor.end();

    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        question: question,
        grounding: question.grounding,
        performance: metrics,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      await displayGroundedQuestionResults(question, metrics);
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
  console.log(chalk.cyan('\n📋 Interactive Grounded Generation Setup'));
  
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
      type: 'input',
      name: 'topic',
      message: 'Specific topic (optional):',
      default: ''
    }
  ]);

  return answers;
}

/**
 * Display grounded incident results
 */
async function displayGroundedIncidentResults(incident, metrics) {
  console.log(chalk.green('\n✅ Web-Grounded Incident Generated!'));
  console.log(chalk.blue('\n📖 Verified Cricket Incident:'));
  console.log(chalk.blue('══════════════════════════════'));
  
  console.log(chalk.white('\n📝 Summary:'));
  console.log(`   ${chalk.cyan(incident.summary)}`);
  
  console.log(chalk.white('\n📖 Full Incident:'));
  console.log(`   ${chalk.gray(incident.incident)}`);
  
  console.log(chalk.white('\n✅ Web-Verified Facts:'));
  incident.verifiedFacts.forEach((fact, index) => {
    console.log(`   ${index + 1}. ${chalk.green(fact)}`);
  });
  
  if (incident.sources && incident.sources.length > 0) {
    console.log(chalk.white('\n🌐 Verified Sources:'));
    incident.sources.forEach(source => {
      console.log(`   • ${chalk.blue(source)}`);
    });
  }

  if (incident.storyElements && incident.storyElements.length > 0) {
    console.log(chalk.white('\n🎭 Story Elements:'));
    incident.storyElements.forEach((element, index) => {
      console.log(`   ${index + 1}. ${chalk.magenta(element)}`);
    });
  }

  if (incident.searchTerms && incident.searchTerms.length > 0) {
    console.log(chalk.white('\n🔍 Search Terms Used:'));
    incident.searchTerms.forEach(term => {
      console.log(`   • ${chalk.yellow(term)}`);
    });
  }

  console.log(chalk.white(`\n🎯 Confidence Level: ${getConfidenceColor(incident.confidence)}${incident.confidence}${chalk.reset()}`));
  
  // Display grounding information
  await displayGroundingInfo(incident.grounding);
}

/**
 * Display grounded question results
 */
async function displayGroundedQuestionResults(question, metrics) {
  console.log(chalk.green('\n✅ Web-Grounded Question Generated!'));
  console.log(chalk.blue('\n❓ Verified Cricket Question:'));
  console.log(chalk.blue('═══════════════════════════════'));
  
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
  
  if (question.verifiedSources && question.verifiedSources.length > 0) {
    console.log(chalk.white('\n🌐 Verified Sources:'));
    question.verifiedSources.forEach(source => {
      console.log(`   • ${chalk.blue(source)}`);
    });
  }

  if (question.storyElements && question.storyElements.length > 0) {
    console.log(chalk.white('\n🎭 Story Elements:'));
    question.storyElements.forEach((element, index) => {
      console.log(`   ${index + 1}. ${chalk.magenta(element)}`);
    });
  }

  if (question.searchQueries && question.searchQueries.length > 0) {
    console.log(chalk.white('\n🔎 Search Queries Used:'));
    question.searchQueries.forEach(query => {
      console.log(`   • ${chalk.cyan(query)}`);
    });
  }

  console.log(chalk.white(`\n🎯 Confidence Level: ${getConfidenceColor(question.confidence)}${question.confidence}${chalk.reset()}`));
  
  // Display grounding information
  await displayGroundingInfo(question.grounding);
}

/**
 * Display grounding metadata
 */
async function displayGroundingInfo(grounding) {
  if (!grounding) return;

  console.log(chalk.blue('\n🌐 Web Search Grounding:'));
  console.log(chalk.blue('═══════════════════════'));
  
  if (grounding.hasGrounding) {
    console.log(chalk.green('   ✅ Web search performed successfully'));
    console.log(`   🔍 Search queries: ${grounding.searchQueries.length}`);
    console.log(`   📊 Grounding sources: ${grounding.groundingChunks.length}`);
    
    if (grounding.searchQueries.length > 0) {
      console.log(chalk.white('\n📋 Queries Executed:'));
      grounding.searchQueries.forEach((query, index) => {
        console.log(`   ${index + 1}. ${chalk.yellow(query)}`);
      });
    }

    if (grounding.groundingChunks.length > 0) {
      console.log(chalk.white('\n🌐 Web Sources Found:'));
      grounding.groundingChunks.forEach((chunk, index) => {
        if (chunk.web) {
          console.log(`   ${index + 1}. ${chalk.blue(chunk.web.title || 'Web Source')}`);
          if (chunk.web.uri) {
            console.log(`      🔗 ${chalk.gray(chunk.web.uri)}`);
          }
        }
      });
    }

    // Resolve actual URLs
    if (grounding.groundingChunks.length > 0) {
      const resolvedSources = await URLResolver.resolveAllGroundingURLs(grounding.groundingChunks);
      
      if (resolvedSources.length > 0) {
        console.log(chalk.white('\n✅ Verified Source URLs:'));
        resolvedSources.forEach((source, index) => {
          console.log(`   ${index + 1}. ${chalk.blue(source.title)}`);
          console.log(`      🌐 ${chalk.green(source.actualURL)}`);
        });
      }
    }
  } else {
    console.log(chalk.yellow('   ⚠️  No web search grounding detected'));
    console.log(chalk.gray('   📝 Response may be based on training data only'));
  }
}

/**
 * Get color for confidence level
 */
function getConfidenceColor(confidence) {
  if (!confidence) return chalk.gray;
  
  const level = confidence.toLowerCase();
  if (level === 'high') return chalk.green;
  if (level === 'medium') return chalk.yellow;
  if (level === 'low') return chalk.red;
  return chalk.gray;
}