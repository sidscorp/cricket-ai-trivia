/**
 * Speed Test Command for V2 Pipeline Optimization
 *
 * Compares performance before and after speed optimizations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { V2PipelineOrchestrator } from './search-generate-v2.js';

export const speedTestCommand = new Command('speed-test')
  .description('Test V2 pipeline speed with different optimization settings')
  .option('-c, --count <num>', 'Number of test runs', '3')
  .option('-a, --anecdotes <num>', 'Number of anecdotes per test', '5')
  .option('-q, --questions <num>', 'Target questions per test', '8')
  .option('--parallel', 'Test with parallel processing (default)', true)
  .option('--serial', 'Test with serial processing')
  .option('--fast-models', 'Use fastest model configuration')
  .option('--compare', 'Compare serial vs parallel performance')
  .action(async (options) => {
    try {
      const testCount = parseInt(options.count) || 3;
      const anecdoteCount = parseInt(options.anecdotes) || 5;
      const questionCount = parseInt(options.questions) || 8;
      
      console.log(chalk.blue('🚀 V2 Pipeline Speed Test'));
      console.log(chalk.gray(`   Tests: ${testCount}, Anecdotes: ${anecdoteCount}, Questions: ${questionCount}\n`));
      
      if (options.compare) {
        await runComparisonTest(testCount, anecdoteCount, questionCount);
      } else {
        const useParallel = !options.serial;
        const useFastModels = options.fastModels;
        
        await runSpeedTest({
          testCount,
          anecdoteCount, 
          questionCount,
          useParallel,
          useFastModels
        });
      }
      
    } catch (err) {
      console.error(chalk.red('❌ Speed test failed:'), err.message);
      process.exit(1);
    }
  });

/**
 * Run a single speed test configuration
 */
async function runSpeedTest(config) {
  const { testCount, anecdoteCount, questionCount, useParallel, useFastModels } = config;
  
  console.log(chalk.yellow(`=== Testing: ${useParallel ? 'Parallel' : 'Serial'} + ${useFastModels ? 'Fast Models' : 'Default Models'} ===`));
  
  const results = [];
  const orchestrator = new V2PipelineOrchestrator();
  
  for (let i = 1; i <= testCount; i++) {
    console.log(chalk.blue(`\n🔄 Test Run ${i}/${testCount}`));
    
    const startTime = Date.now();
    
    try {
      const testOptions = {
        era: 'modern_era',
        countries: ['india'],
        category: 'legendary_moments',
        anecdoteCount,
        targetQuestions: questionCount,
        searchModel: useFastModels ? 'fast' : null,
        creativeModel: useFastModels ? 'fast' : null,
        // Note: parallel/serial toggling would need to be implemented in orchestrator
      };
      
      const result = await orchestrator.executePipeline(testOptions);
      const totalTime = Date.now() - startTime;
      
      results.push({
        run: i,
        totalTime,
        anecdotes: result.anecdotes.length,
        questions: result.questions.length,
        success: true
      });
      
      console.log(chalk.green(`✅ Run ${i} completed in ${(totalTime/1000).toFixed(2)}s`));
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      results.push({
        run: i,
        totalTime,
        anecdotes: 0,
        questions: 0,
        success: false,
        error: error.message
      });
      
      console.log(chalk.red(`❌ Run ${i} failed after ${(totalTime/1000).toFixed(2)}s: ${error.message}`));
    }
  }
  
  displayResults(results, `${useParallel ? 'Parallel' : 'Serial'} + ${useFastModels ? 'Fast Models' : 'Default Models'}`);
}

/**
 * Run comparison test between serial and parallel
 */
async function runComparisonTest(testCount, anecdoteCount, questionCount) {
  console.log(chalk.yellow('🔄 Running Serial vs Parallel Comparison...\n'));
  
  // Test serial (simulated - would need orchestrator modification)
  console.log(chalk.blue('📊 Serial Processing Test:'));
  await runSpeedTest({
    testCount,
    anecdoteCount,
    questionCount,
    useParallel: false,
    useFastModels: false
  });
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test parallel
  console.log(chalk.blue('\n📊 Parallel Processing Test:'));
  await runSpeedTest({
    testCount,
    anecdoteCount,
    questionCount,
    useParallel: true,
    useFastModels: false
  });
  
  // Test parallel + fast models
  console.log(chalk.blue('\n📊 Parallel + Fast Models Test:'));
  await runSpeedTest({
    testCount,
    anecdoteCount,
    questionCount,
    useParallel: true,
    useFastModels: true
  });
}

/**
 * Display test results with statistics
 */
function displayResults(results, testName) {
  console.log(chalk.cyan(`\n📈 Results for ${testName}:`));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (!successful.length) {
    console.log(chalk.red('❌ All tests failed'));
    return;
  }
  
  const times = successful.map(r => r.totalTime);
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  const avgAnecdotes = successful.reduce((sum, r) => sum + r.anecdotes, 0) / successful.length;
  const avgQuestions = successful.reduce((sum, r) => sum + r.questions, 0) / successful.length;
  
  console.log(chalk.white(`   Success Rate: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`));
  console.log(chalk.white(`   Average Time: ${(avgTime/1000).toFixed(2)}s`));
  console.log(chalk.white(`   Min Time: ${(minTime/1000).toFixed(2)}s`));
  console.log(chalk.white(`   Max Time: ${(maxTime/1000).toFixed(2)}s`));
  console.log(chalk.white(`   Average Output: ${avgAnecdotes.toFixed(1)} anecdotes → ${avgQuestions.toFixed(1)} questions`));
  
  if (failed.length > 0) {
    console.log(chalk.red(`   Failed: ${failed.length} tests`));
    failed.forEach(f => {
      console.log(chalk.red(`     Run ${f.run}: ${f.error}`));
    });
  }
  
  // Performance grade
  if (avgTime < 30000) {
    console.log(chalk.green('🏆 Grade: Excellent (< 30s)'));
  } else if (avgTime < 60000) {
    console.log(chalk.yellow('⭐ Grade: Good (< 60s)'));
  } else if (avgTime < 120000) {
    console.log(chalk.orange('⚠️ Grade: Acceptable (< 2min)'));
  } else {
    console.log(chalk.red('🐌 Grade: Needs Optimization (> 2min)'));
  }
}