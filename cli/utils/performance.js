/**
 * Performance Monitoring Utilities
 * 
 * Tracks timing, memory usage, and performance metrics for the
 * cricket question generation pipeline.
 */

import chalk from 'chalk';
import { config } from './config.js';

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: null,
      endTime: null,
      duration: null,
      steps: [],
      memoryUsage: {}
    };
  }

  /**
   * Start performance monitoring
   */
  start(operation = 'Unknown Operation') {
    this.metrics.startTime = process.hrtime.bigint();
    this.metrics.operation = operation;
    this.metrics.steps = [];
    this.logMemoryUsage('start');
    
    console.log(chalk.blue(`\n⏱️  Starting: ${operation}`));
    return this;
  }

  /**
   * Mark a step in the process
   */
  step(stepName) {
    const currentTime = process.hrtime.bigint();
    const stepDuration = this.metrics.startTime 
      ? Number(currentTime - this.metrics.startTime) / 1000000 // Convert to milliseconds
      : 0;

    this.metrics.steps.push({
      name: stepName,
      timestamp: currentTime,
      duration: stepDuration
    });

    console.log(chalk.gray(`   📝 ${stepName} (${stepDuration.toFixed(0)}ms)`));
    return this;
  }

  /**
   * End performance monitoring and display results
   */
  end() {
    this.metrics.endTime = process.hrtime.bigint();
    this.metrics.duration = Number(this.metrics.endTime - this.metrics.startTime) / 1000000; // Convert to milliseconds
    this.logMemoryUsage('end');

    this.displayResults();
    return this.metrics;
  }

  /**
   * Log current memory usage
   */
  logMemoryUsage(phase) {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage[phase] = {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }

  /**
   * Display performance results
   */
  displayResults() {
    const { duration } = this.metrics;
    const { targetTimeMs, warningTimeMs, maxTimeMs } = config.performance;

    console.log(chalk.blue('\n📊 Performance Results:'));
    console.log(chalk.blue('═══════════════════════════'));

    // Overall timing
    let timeColor = chalk.green;
    let timeStatus = '✅ Excellent';
    
    if (duration > maxTimeMs) {
      timeColor = chalk.red;
      timeStatus = '❌ Too Slow';
    } else if (duration > targetTimeMs) {
      timeColor = chalk.yellow;
      timeStatus = '⚠️  Above Target';
    } else if (duration < warningTimeMs) {
      timeColor = chalk.cyan;
      timeStatus = '🚀 Very Fast';
    }

    console.log(`   ⏱️  Total Time: ${timeColor(duration.toFixed(0))}ms ${timeStatus}`);
    console.log(`   🎯 Target: ${targetTimeMs}ms | Limit: ${maxTimeMs}ms`);

    // Step breakdown
    if (this.metrics.steps.length > 0) {
      console.log(chalk.blue('\n📝 Step Breakdown:'));
      this.metrics.steps.forEach((step, index) => {
        const previousDuration = index > 0 ? this.metrics.steps[index - 1].duration : 0;
        const stepTime = step.duration - previousDuration;
        console.log(`   ${index + 1}. ${step.name}: ${stepTime.toFixed(0)}ms`);
      });
    }

    // Memory usage
    const memStart = this.metrics.memoryUsage.start;
    const memEnd = this.metrics.memoryUsage.end;
    if (memStart && memEnd) {
      console.log(chalk.blue('\n💾 Memory Usage:'));
      console.log(`   📈 Heap Used: ${memStart.heapUsed}MB → ${memEnd.heapUsed}MB`);
      console.log(`   📊 Total RSS: ${memStart.rss}MB → ${memEnd.rss}MB`);
    }

    console.log('');
  }

  /**
   * Create a simple timer for quick measurements
   */
  static timer(label = 'Operation') {
    const start = process.hrtime.bigint();
    
    return {
      end: () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000;
        console.log(chalk.gray(`   ⏱️  ${label}: ${duration.toFixed(0)}ms`));
        return duration;
      }
    };
  }

  /**
   * Benchmark a function
   */
  static async benchmark(fn, label = 'Function') {
    const monitor = new PerformanceMonitor();
    monitor.start(label);
    
    try {
      const result = await fn();
      monitor.end();
      return { result, metrics: monitor.metrics };
    } catch (error) {
      monitor.end();
      throw error;
    }
  }
}

export { PerformanceMonitor as default };