/**
 * Performance Command
 * 
 * Dedicated performance testing and benchmarking for the cricket pipeline
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { EnhancedGeminiService } from '../services/enhanced-gemini.js';
import { GoogleSearchService } from '../services/google-search.js';
import { PerformanceMonitor } from '../utils/performance.js';

export const performanceCommand = new Command('performance')
  .alias('perf')
  .description('Performance testing and benchmarking')
  .option('-n, --count <number>', 'Number of test iterations', '5')
  .option('-t, --target <ms>', 'Target time in milliseconds', '4000')
  .option('-w, --warmup <number>', 'Warmup iterations', '2')
  .option('-c, --concurrent <number>', 'Concurrent requests (be careful!)', '1')
  .option('--component <type>', 'Test specific component (gemini|search|pipeline)', 'pipeline')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🏃 Cricket Pipeline Performance Test'));
      console.log(chalk.blue('═══════════════════════════════════'));

      const count = parseInt(options.count);
      const target = parseInt(options.target);
      const warmup = parseInt(options.warmup);
      const concurrent = parseInt(options.concurrent);

      if (concurrent > 5) {
        console.warn(chalk.yellow('⚠️  High concurrency may hit API rate limits'));
      }

      const results = await runPerformanceTest({
        count,
        target,
        warmup,
        concurrent,
        component: options.component
      });

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        displayPerformanceResults(results, target);
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Performance test failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Run performance test
 */
async function runPerformanceTest(options) {
  const { count, target, warmup, concurrent, component } = options;
  
  console.log(chalk.cyan(`\n🔥 Testing ${component} component`));
  console.log(chalk.gray(`   Warmup: ${warmup} iterations`));
  console.log(chalk.gray(`   Test: ${count} iterations`));
  console.log(chalk.gray(`   Target: ${target}ms`));
  console.log(chalk.gray(`   Concurrency: ${concurrent}`));

  const geminiService = new EnhancedGeminiService();
  const searchService = new GoogleSearchService();

  // Warmup phase
  if (warmup > 0) {
    console.log(chalk.yellow(`\n🔥 Warming up (${warmup} iterations)...`));
    for (let i = 0; i < warmup; i++) {
      try {
        await runSingleTest(component, geminiService, searchService);
        process.stdout.write(chalk.gray('.'));
      } catch (error) {
        process.stdout.write(chalk.red('x'));
      }
    }
    console.log(chalk.yellow(' Warmup complete!'));
  }

  // Main test phase
  console.log(chalk.cyan(`\n⚡ Running performance test...`));
  const testResults = [];
  
  if (concurrent === 1) {
    // Sequential testing
    for (let i = 0; i < count; i++) {
      const result = await runSingleTest(component, geminiService, searchService);
      testResults.push(result);
      process.stdout.write(result.success ? chalk.green('.') : chalk.red('x'));
    }
  } else {
    // Concurrent testing
    const batches = Math.ceil(count / concurrent);
    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrent, count - batch * concurrent);
      const promises = Array(batchSize).fill().map(() => 
        runSingleTest(component, geminiService, searchService)
      );
      
      const batchResults = await Promise.allSettled(promises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          testResults.push(result.value);
          process.stdout.write(result.value.success ? chalk.green('.') : chalk.red('x'));
        } else {
          testResults.push({ success: false, duration: null, error: result.reason.message });
          process.stdout.write(chalk.red('x'));
        }
      });
    }
  }

  console.log(chalk.cyan(' Test complete!'));

  return analyzePerformanceResults(testResults, target, options);
}

/**
 * Run a single test iteration
 */
async function runSingleTest(component, geminiService, searchService) {
  const startTime = process.hrtime.bigint();
  
  try {
    if (component === 'gemini') {
      await geminiService.generateIncident();
    } else if (component === 'search') {
      await searchService.searchCricketIncident('Kapil Dev catch 1983 World Cup');
    } else if (component === 'pipeline') {
      const incident = await geminiService.generateIncident();
      const verification = await searchService.searchCricketIncident(incident.incident);
      await geminiService.generateVerifiableQuestion({ incident });
    }
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
      success: true,
      duration,
      timestamp: new Date()
    };
    
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    
    return {
      success: false,
      duration,
      error: error.message,
      timestamp: new Date()
    };
  }
}

/**
 * Analyze performance test results
 */
function analyzePerformanceResults(results, target, options) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length === 0) {
    return {
      success: false,
      error: 'All tests failed',
      results: results
    };
  }
  
  const durations = successful.map(r => r.duration);
  const stats = calculateStatistics(durations);
  
  const performance = {
    component: options.component,
    totalTests: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: successful.length / results.length,
    target: target,
    stats: stats,
    meetsTarget: stats.mean <= target,
    grade: getPerformanceGrade(stats.mean, target),
    results: results
  };

  return performance;
}

/**
 * Calculate statistical measures
 */
function calculateStatistics(durations) {
  durations.sort((a, b) => a - b);
  
  const sum = durations.reduce((a, b) => a + b, 0);
  const mean = sum / durations.length;
  
  const variance = durations.reduce((sum, duration) => sum + Math.pow(duration - mean, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  
  const median = durations.length % 2 === 0
    ? (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2
    : durations[Math.floor(durations.length / 2)];
  
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  
  return {
    min: durations[0],
    max: durations[durations.length - 1],
    mean: mean,
    median: median,
    stdDev: stdDev,
    p95: p95,
    p99: p99,
    count: durations.length
  };
}

/**
 * Get performance grade
 */
function getPerformanceGrade(mean, target) {
  const ratio = mean / target;
  if (ratio <= 0.75) return 'excellent';
  if (ratio <= 1.0) return 'good';
  if (ratio <= 1.5) return 'acceptable';
  return 'poor';
}

/**
 * Display performance results
 */
function displayPerformanceResults(results, target) {
  if (!results.success) {
    console.error(chalk.red('\n❌ Performance test failed'));
    return;
  }

  const { stats, grade, successRate, component } = results;
  
  console.log(chalk.green('\n📊 Performance Test Results'));
  console.log(chalk.blue('══════════════════════════'));
  
  // Component and basic stats
  console.log(`   🧩 Component: ${chalk.cyan(component)}`);
  console.log(`   ✅ Success Rate: ${chalk.green(Math.round(successRate * 100))}% (${results.successful}/${results.totalTests})`);
  
  // Performance metrics
  console.log(chalk.blue('\n⏱️  Timing Statistics:'));
  console.log(`   📊 Mean: ${getTimeColor(stats.mean, target)}${stats.mean.toFixed(0)}ms${chalk.reset()}`);
  console.log(`   📈 Median: ${chalk.cyan(stats.median.toFixed(0))}ms`);
  console.log(`   📉 Min: ${chalk.green(stats.min.toFixed(0))}ms`);
  console.log(`   📈 Max: ${chalk.red(stats.max.toFixed(0))}ms`);
  console.log(`   📊 Std Dev: ${chalk.gray(stats.stdDev.toFixed(0))}ms`);
  
  // Percentiles
  console.log(chalk.blue('\n📈 Percentiles:'));
  console.log(`   🎯 95th: ${getTimeColor(stats.p95, target)}${stats.p95.toFixed(0)}ms${chalk.reset()}`);
  console.log(`   🎯 99th: ${getTimeColor(stats.p99, target)}${stats.p99.toFixed(0)}ms${chalk.reset()}`);
  
  // Target comparison
  console.log(chalk.blue('\n🎯 Target Analysis:'));
  console.log(`   🎯 Target: ${chalk.cyan(target)}ms`);
  console.log(`   📊 Actual: ${getTimeColor(stats.mean, target)}${stats.mean.toFixed(0)}ms${chalk.reset()}`);
  console.log(`   📈 Difference: ${getDifferenceColor(stats.mean, target)}${(stats.mean - target).toFixed(0)}ms${chalk.reset()}`);
  console.log(`   🏆 Grade: ${getGradeColor(grade)}${grade.toUpperCase()}${chalk.reset()}`);
  
  // Performance assessment
  console.log(chalk.blue('\n💡 Assessment:'));
  
  if (results.meetsTarget) {
    console.log(`   ✅ ${chalk.green('Target achieved! Performance is within acceptable range.')}`);
  } else {
    console.log(`   ❌ ${chalk.red('Target missed. Performance optimization needed.')}`);
  }
  
  if (grade === 'excellent') {
    console.log(`   🚀 ${chalk.green('Excellent performance! Well under target.')}`);
  } else if (grade === 'good') {
    console.log(`   ✅ ${chalk.yellow('Good performance. Meeting target requirements.')}`);
  } else if (grade === 'acceptable') {
    console.log(`   ⚠️  ${chalk.yellow('Acceptable but could be improved.')}`);
  } else {
    console.log(`   🐌 ${chalk.red('Poor performance. Significant optimization needed.')}`);
  }
  
  // Recommendations
  console.log(chalk.blue('\n🔧 Recommendations:'));
  
  if (stats.stdDev > stats.mean * 0.3) {
    console.log(`   📊 ${chalk.yellow('High variance detected - results are inconsistent')}`);
    console.log(`      • Check network stability`);
    console.log(`      • Consider API rate limiting`);
  }
  
  if (!results.meetsTarget) {
    console.log(`   ⚡ ${chalk.yellow('Performance optimizations:')}`);
    console.log(`      • Reduce Gemini model temperature`);
    console.log(`      • Limit search result count`);
    console.log(`      • Implement request caching`);
    console.log(`      • Use faster model variants`);
  }
  
  if (successRate < 0.95) {
    console.log(`   🔧 ${chalk.yellow('Reliability improvements needed:')}`);
    console.log(`      • Add retry logic for failed requests`);
    console.log(`      • Implement circuit breaker pattern`);
    console.log(`      • Check API key validity and quotas`);
  }
}

/**
 * Get color for time values based on target
 */
function getTimeColor(time, target) {
  if (time <= target * 0.75) return chalk.green;
  if (time <= target) return chalk.yellow;
  if (time <= target * 1.5) return chalk.red;
  return chalk.red.bold;
}

/**
 * Get color for difference values
 */
function getDifferenceColor(actual, target) {
  const diff = actual - target;
  if (diff <= 0) return chalk.green;
  if (diff <= target * 0.25) return chalk.yellow;
  return chalk.red;
}

/**
 * Get color for grade
 */
function getGradeColor(grade) {
  switch (grade) {
    case 'excellent': return chalk.green.bold;
    case 'good': return chalk.green;
    case 'acceptable': return chalk.yellow;
    case 'poor': return chalk.red;
    default: return chalk.gray;
  }
}