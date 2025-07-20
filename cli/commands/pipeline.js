/**
 * Pipeline Command
 * 
 * Test the complete AI-powered question generation pipeline
 * including incident generation, web verification, and question creation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { GroundedGeminiService } from '../services/archived/grounded-gemini.js';
import { PerformanceMonitor } from '../utils/performance.js';
import { URLResolver } from '../utils/url-resolver.js';

export const pipelineCommand = new Command('pipeline')
  .description('Test complete AI question generation pipeline')
  .option('-n, --count <number>', 'Number of questions to generate', '1')
  .option('-e, --era <era>', 'Cricket era filter', 'all_eras')
  .option('-c, --country <country>', 'Country filter', 'all_countries')
  .option('-d, --difficulty <difficulty>', 'Difficulty level', 'medium')
  .option('--resolve', 'Enable URL resolution step (default)', true)
  .option('--no-resolve', 'Skip URL resolution step')
  .option('--json', 'Output results as JSON')
  .option('--detailed', 'Show detailed step-by-step process')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🔄 Cricket Pipeline Test'));
      console.log(chalk.blue('═══════════════════════'));

      const count = parseInt(options.count);
      
      if (count < 1 || count > 10) {
        console.error(chalk.red('❌ Count must be between 1 and 10'));
        process.exit(1);
      }

      const geminiService = new GroundedGeminiService();
      const monitor = new PerformanceMonitor();

      console.log(chalk.cyan(`🚀 Pipeline Type: Grounded (Web-Verified)`));

      const results = await runPipeline(
        geminiService,
        monitor,
        {
          count,
          era: options.era,
          country: options.country,
          difficulty: options.difficulty,
          detailed: options.detailed,
          resolveUrls: options.resolve
        }
      );

      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          results: results,
          summary: generateSummary(results),
          timestamp: new Date().toISOString()
        }, null, 2));
      } else {
        displayPipelineResults(results, options.detailed);
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Pipeline failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Run the complete pipeline
 */
async function runPipeline(geminiService, monitor, options) {
  monitor.start('Cricket Question Generation Pipeline');
  
  const results = [];
  const { count, detailed } = options;
  
  console.log(chalk.cyan(`\n🚀 Starting pipeline for ${count} question(s)...`));
  
  for (let i = 0; i < count; i++) {
    if (count > 1) {
      console.log(chalk.blue(`\n📝 Question ${i + 1}/${count}`));
      console.log(chalk.blue('═══════════════════'));
    }
    
    const questionResult = await generateSingleQuestion(
      geminiService, 
      monitor, 
      options, 
      i + 1
    );
    
    results.push(questionResult);
    
    if (detailed) {
      displayQuestionSummary(questionResult, i + 1);
    }
  }
  
  const metrics = monitor.end();
  
  return {
    questions: results,
    totalTime: metrics.duration,
    avgTimePerQuestion: metrics.duration / count,
    successCount: results.filter(r => r.success).length,
    verifiedCount: results.filter(r => r.grounding?.hasGrounding).length,
    urlsResolvedCount: results.filter(r => r.resolvedSources?.length > 0).length
  };
}

/**
 * Generate a single question through the pipeline
 */
async function generateSingleQuestion(geminiService, monitor, options, questionNumber) {
  const questionTimer = PerformanceMonitor.timer(`Question ${questionNumber}`);
  
  try {
    // Generate grounded question with filters
    monitor.step(`Q${questionNumber}: Generating grounded question`);
    const question = await geminiService.generateVerifiedQuestion({
      era: options.era,
      country: options.country,
      difficulty: options.difficulty
    });
    
    // Resolve grounding URLs if enabled and available
    let resolvedSources = null;
    if (options.resolveUrls && question.grounding && question.grounding.groundingChunks) {
      monitor.step(`Q${questionNumber}: Resolving source URLs`);
      resolvedSources = await URLResolver.resolveAllGroundingURLs(question.grounding.groundingChunks);
    } else if (!options.resolveUrls) {
      console.log(chalk.gray(`   📝 Q${questionNumber}: Skipping URL resolution (disabled)`));
    }
    
    const duration = questionTimer.end();
    
    return {
      success: true,
      questionNumber,
      question,
      grounding: question.grounding,
      resolvedSources,
      duration,
      timestamp: new Date()
    };
    
  } catch (error) {
    const duration = questionTimer.end();
    console.error(chalk.red(`   ❌ Q${questionNumber} failed: ${error.message}`));
    
    return {
      success: false,
      questionNumber,
      error: error.message,
      duration,
      timestamp: new Date()
    };
  }
}


/**
 * Display single question summary
 */
function displayQuestionSummary(result, questionNumber) {
  if (!result.success) {
    console.log(`   ❌ Failed (${result.duration.toFixed(0)}ms): ${result.error}`);
    return;
  }
  
  const { question, duration, grounding, resolvedSources } = result;
  
  console.log(`   ✅ Generated (${duration.toFixed(0)}ms)`);
  console.log(`   📝 Topic: ${chalk.cyan(question.topic)}`);
  
  if (grounding && grounding.hasGrounding) {
    console.log(`   🌐 Web-verified: ${chalk.green(grounding.groundingChunks.length)} sources`);
    if (resolvedSources && resolvedSources.length > 0) {
      console.log(`   🔗 URLs resolved: ${chalk.blue(resolvedSources.length)}`);
    }
  } else {
    console.log(`   ⚠️  No web grounding detected`);
  }
}

/**
 * Display complete pipeline results
 */
function displayPipelineResults(results, detailed) {
  const { questions, totalTime, avgTimePerQuestion, successCount, verifiedCount, urlsResolvedCount } = results;
  
  console.log(chalk.green('\n🎉 Pipeline Complete!'));
  console.log(chalk.blue('\n📊 Summary Results:'));
  console.log(chalk.blue('═══════════════════'));
  
  console.log(`   ⏱️  Total Time: ${chalk.cyan(totalTime.toFixed(0))}ms`);
  console.log(`   📈 Avg Time/Question: ${chalk.cyan(avgTimePerQuestion.toFixed(0))}ms`);
  console.log(`   ✅ Success Rate: ${chalk.green(successCount)}/${questions.length} (${Math.round(successCount/questions.length*100)}%)`);
  
  if (verifiedCount > 0) {
    console.log(`   🌐 Web-verified: ${chalk.green(verifiedCount)}/${successCount} (${Math.round(verifiedCount/successCount*100)}%)`);
  }
  if (urlsResolvedCount > 0) {
    console.log(`   🔗 URLs resolved: ${chalk.blue(urlsResolvedCount)}/${successCount}`);
  }
  
  // Performance assessment
  const avgTime = avgTimePerQuestion;
  let perfAssessment;
  if (avgTime <= 3000) {
    perfAssessment = `${chalk.green('🚀 Excellent')} - Under 3s target`;
  } else if (avgTime <= 4000) {
    perfAssessment = `${chalk.yellow('✅ Good')} - Within 4s target`;
  } else if (avgTime <= 6000) {
    perfAssessment = `${chalk.red('⚠️  Slow')} - Above 4s target`;
  } else {
    perfAssessment = `${chalk.red('❌ Too Slow')} - Exceeds 6s limit`;
  }
  
  console.log(`   🎯 Performance: ${perfAssessment}`);
  
  // Question details
  if (detailed) {
    console.log(chalk.blue('\n📋 Generated Questions:'));
    console.log(chalk.blue('═══════════════════════'));
    
    questions.forEach((result, index) => {
      if (!result.success) {
        console.log(`\n${index + 1}. ❌ ${chalk.red('FAILED')}`);
        console.log(`   Error: ${chalk.red(result.error)}`);
        console.log(`   Time: ${result.duration.toFixed(0)}ms`);
        return;
      }
      
      const { question, duration, grounding, resolvedSources } = result;
      
      console.log(`\n${index + 1}. ✅ ${chalk.green(question.topic)}`);
      console.log(`   ⏱️  Time: ${duration.toFixed(0)}ms`);
      
      if (grounding && grounding.hasGrounding) {
        console.log(`   🌐 Web-verified: ${chalk.green(grounding.groundingChunks.length + ' sources')}`);
        if (resolvedSources && resolvedSources.length > 0) {
          console.log(`   🔗 Source URLs: ${chalk.blue(resolvedSources.map(s => s.domain).join(', '))}`);
        }
      } else {
        console.log(`   ⚠️  No web grounding`);
      }
      
      console.log(`   📝 Question: ${chalk.gray(question.question.substring(0, 80))}...`);
      console.log(`   🎯 Answer: ${chalk.cyan(question.options[question.correctAnswer])}`);
    });
  }
  
  // Recommendations
  console.log(chalk.blue('\n💡 Recommendations:'));
  console.log(chalk.blue('═══════════════════'));
  
  if (successCount === questions.length) {
    console.log(`   ✅ ${chalk.green('All questions generated successfully!')}`);
  } else {
    console.log(`   ⚠️  ${chalk.yellow(`${questions.length - successCount} questions failed - check API keys and network`)}`);
  }
  
  if (avgTime > 4000) {
    console.log(`   🐌 ${chalk.yellow('Consider optimizing for faster generation:')}`);
    console.log(`      • Reduce Gemini temperature for faster responses`);
    console.log(`      • Limit search result count`);
    console.log(`      • Use parallel processing for multiple questions`);
  }
  
  if (verifiedCount < successCount * 0.7) {
    console.log(`   🔍 ${chalk.yellow('Low web verification rate - consider:')}`);
    console.log(`      • Using more specific filter combinations`);
    console.log(`      • Focusing on well-documented cricket events`);
    console.log(`      • Checking Gemini API grounding permissions`);
  }
}

/**
 * Generate summary for JSON output
 */
function generateSummary(results) {
  const { questions, totalTime, avgTimePerQuestion, successCount, verifiedCount } = results;
  
  return {
    totalQuestions: questions.length,
    successfulQuestions: successCount,
    verifiedQuestions: verifiedCount,
    successRate: successCount / questions.length,
    verificationRate: successCount > 0 ? verifiedCount / successCount : 0,
    performance: {
      totalTimeMs: totalTime,
      avgTimePerQuestionMs: avgTimePerQuestion,
      meetsTarget: avgTimePerQuestion <= 4000,
      grade: avgTimePerQuestion <= 3000 ? 'excellent' : 
             avgTimePerQuestion <= 4000 ? 'good' : 
             avgTimePerQuestion <= 6000 ? 'slow' : 'too_slow'
    }
  };
}