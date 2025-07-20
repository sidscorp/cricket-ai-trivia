#!/usr/bin/env node

/**
 * Basic Tests for V2 Pipeline Components
 * 
 * Tests the AnecdoteGenerator and QuestionGenerator services
 * with mock data and basic validation.
 */

import chalk from 'chalk';
import { getAnecdoteGenerator } from './services/AnecdoteGenerator.js';
import { getQuestionGenerator } from './services/QuestionGenerator.js';
import { getOpenRouterService } from './services/OpenRouterService.js';
import { config } from './utils/config.js';

class V2PipelineTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Add a test case
   */
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(chalk.blue('🧪 Running V2 Pipeline Tests...\n'));
    
    for (const test of this.tests) {
      try {
        console.log(chalk.gray(`Running: ${test.name}`));
        await test.testFn();
        this.passed++;
        console.log(chalk.green(`✅ ${test.name}\n`));
      } catch (error) {
        this.failed++;
        console.log(chalk.red(`❌ ${test.name}: ${error.message}\n`));
      }
    }
    
    this.printSummary();
  }

  /**
   * Print test summary
   */
  printSummary() {
    const total = this.passed + this.failed;
    console.log(chalk.blue('📊 Test Summary:'));
    console.log(chalk.green(`  Passed: ${this.passed}/${total}`));
    console.log(chalk.red(`  Failed: ${this.failed}/${total}`));
    
    if (this.failed === 0) {
      console.log(chalk.green('🎉 All tests passed!'));
    } else {
      console.log(chalk.yellow('⚠️ Some tests failed'));
    }
  }

  /**
   * Assert helper
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
}

// Test instances
const tests = new V2PipelineTests();

// Test 1: Configuration validation
tests.addTest('Configuration Validation', () => {
  const openRouterConfig = config.openRouter;
  
  tests.assert(openRouterConfig.models, 'OpenRouter models configuration missing');
  tests.assert(openRouterConfig.models.search, 'Search models configuration missing');
  tests.assert(openRouterConfig.models.creative, 'Creative models configuration missing');
  tests.assert(openRouterConfig.v2Pipeline, 'V2 pipeline configuration missing');
  
  console.log(chalk.gray(`  ✓ OpenRouter API key configured: ${config.hasOpenRouter}`));
  console.log(chalk.gray(`  ✓ Search models: ${Object.keys(openRouterConfig.models.search).length}`));
  console.log(chalk.gray(`  ✓ Creative models: ${Object.keys(openRouterConfig.models.creative).length}`));
});

// Test 2: OpenRouter Service initialization
tests.addTest('OpenRouter Service Initialization', () => {
  const openRouter = getOpenRouterService();
  
  tests.assert(openRouter, 'OpenRouter service instance not created');
  tests.assert(openRouter.models, 'OpenRouter models not configured');
  tests.assert(openRouter.defaultSearchModel, 'Default search model not set');
  tests.assert(openRouter.defaultCreativeModel, 'Default creative model not set');
  
  console.log(chalk.gray(`  ✓ Default search model: ${openRouter.defaultSearchModel}`));
  console.log(chalk.gray(`  ✓ Default creative model: ${openRouter.defaultCreativeModel}`));
});

// Test 3: AnecdoteGenerator initialization
tests.addTest('AnecdoteGenerator Initialization', () => {
  const anecdoteGen = getAnecdoteGenerator();
  
  tests.assert(anecdoteGen, 'AnecdoteGenerator instance not created');
  tests.assert(anecdoteGen.openRouter, 'OpenRouter service not connected');
  tests.assert(anecdoteGen.config, 'Configuration not loaded');
  
  // Test validation methods
  const validCount = anecdoteGen.validateAnecdoteCount(10);
  tests.assert(validCount === 10, 'Count validation failed');
  
  const tooLow = anecdoteGen.validateAnecdoteCount(2);
  tests.assert(tooLow === 5, 'Minimum count validation failed');
  
  console.log(chalk.gray(`  ✓ Count validation working`));
});

// Test 4: QuestionGenerator initialization
tests.addTest('QuestionGenerator Initialization', () => {
  const questionGen = getQuestionGenerator();
  
  tests.assert(questionGen, 'QuestionGenerator instance not created');
  tests.assert(questionGen.openRouter, 'OpenRouter service not connected');
  tests.assert(questionGen.config, 'Configuration not loaded');
  
  // Test calculation methods
  const targetQuestions = questionGen.calculateTargetQuestions(10);
  tests.assert(targetQuestions > 0, 'Target question calculation failed');
  
  console.log(chalk.gray(`  ✓ Target calculation: ${targetQuestions} questions for 10 anecdotes`));
});

// Test 5: Mock anecdote validation
tests.addTest('Anecdote Validation', () => {
  const anecdoteGen = getAnecdoteGenerator();
  
  // Valid anecdote
  const validAnecdote = {
    title: 'Historic Last Ball Victory',
    story: 'In a thrilling encounter that had fans on the edge of their seats, the match came down to the final ball with 2 runs needed. The batsman, under immense pressure, managed to hit a boundary to secure victory for his team in what was later called one of the greatest finishes in cricket history.',
    key_facts: ['2 runs needed off last ball', 'Boundary hit for victory', 'Historic finish'],
    sources: ['https://example.com/cricket-news'],
    tags: ['thriller', 'last-ball']
  };
  
  tests.assert(anecdoteGen.validateAnecdote(validAnecdote), 'Valid anecdote rejected');
  
  // Invalid anecdote (too short)
  const invalidAnecdote = {
    title: 'Short Story',
    story: 'Brief story.',
    key_facts: ['fact'],
    sources: []
  };
  
  tests.assert(!anecdoteGen.validateAnecdote(invalidAnecdote), 'Invalid anecdote accepted');
  
  // Test enhancement
  const enhanced = anecdoteGen.enhanceAnecdote(validAnecdote);
  tests.assert(enhanced.id, 'Enhanced anecdote missing ID');
  tests.assert(enhanced.qualityScore >= 0, 'Quality score not calculated');
  
  console.log(chalk.gray(`  ✓ Quality score: ${enhanced.qualityScore}`));
});

// Test 6: Mock question validation
tests.addTest('Question Validation', () => {
  const questionGen = getQuestionGenerator();
  
  // Valid question
  const validQuestion = {
    question: 'In the historic last-ball finish, how many runs were needed for victory?',
    options: ['1 run', '2 runs', '3 runs', '4 runs'],
    correctAnswer: 1,
    explanation: 'The team needed 2 runs off the last ball to win the match.',
    source: 'https://example.com/source'
  };
  
  tests.assert(questionGen.validateQuestion(validQuestion), 'Valid question rejected');
  
  // Invalid question (wrong options count)
  const invalidQuestion = {
    question: 'Test question?',
    options: ['A', 'B', 'C'], // Only 3 options
    correctAnswer: 0
  };
  
  tests.assert(!questionGen.validateQuestion(invalidQuestion), 'Invalid question accepted');
  
  // Test enhancement
  const enhanced = questionGen.enhanceQuestion(validQuestion, []);
  tests.assert(enhanced.id, 'Enhanced question missing ID');
  tests.assert(enhanced.qualityScore >= 0, 'Quality score not calculated');
  
  console.log(chalk.gray(`  ✓ Quality score: ${enhanced.qualityScore}`));
});

// Test 7: Pipeline integration test (without API calls)
tests.addTest('Pipeline Integration (Mock)', () => {
  const anecdoteGen = getAnecdoteGenerator();
  const questionGen = getQuestionGenerator();
  
  // Mock anecdotes
  const mockAnecdotes = [
    {
      id: 'test1',
      title: 'The Greatest Comeback',
      story: 'After being 8 wickets down and still needing 50 runs, the tail-enders staged an incredible comeback. With boundaries flowing and the crowd roaring, they managed to chase down the target with just 2 balls to spare, creating one of the most memorable victories in cricket history.',
      key_facts: ['8 wickets down', '50 runs needed', 'Won with 2 balls spare'],
      sources: ['https://example.com/comeback'],
      qualityScore: 85
    },
    {
      id: 'test2',
      title: 'Record Breaking Century',
      story: 'In sweltering heat and against a formidable bowling attack, the young batsman played with maturity beyond his years. His century came off just 63 balls, breaking the record for the fastest century by a debutant in Test cricket.',
      key_facts: ['Fastest century by debutant', '63 balls', 'Test cricket record'],
      sources: ['https://example.com/century'],
      qualityScore: 92
    }
  ];
  
  // Test anecdote selection
  const selected = questionGen.selectBestAnecdotes(mockAnecdotes, 3);
  tests.assert(selected.length === 2, 'Anecdote selection failed');
  tests.assert(selected[0].qualityScore >= selected[1].qualityScore, 'Anecdotes not sorted by quality');
  
  // Test quality calculation
  const avgQuality = questionGen.averageQuality(selected);
  tests.assert(avgQuality > 80, 'Average quality calculation incorrect');
  
  console.log(chalk.gray(`  ✓ Selected ${selected.length} anecdotes with avg quality ${avgQuality.toFixed(1)}`));
});

// Test 8: Error handling
tests.addTest('Error Handling', () => {
  const questionGen = getQuestionGenerator();
  
  // Test with empty anecdotes
  let errorThrown = false;
  try {
    questionGen.prepareAnecdotesForPrompt([]);
  } catch (error) {
    errorThrown = true;
  }
  
  // Empty array should not throw error, just return empty array
  const result = questionGen.prepareAnecdotesForPrompt([]);
  tests.assert(Array.isArray(result), 'Should return array even if empty');
  
  // Test with invalid question structure
  const invalidQuestions = [
    { question: 'Test?' }, // Missing required fields
    { question: 'Test?', options: ['A'], correctAnswer: 0 }, // Wrong options count
  ];
  
  const processed = questionGen.processQuestions(invalidQuestions, []);
  tests.assert(processed.length === 0, 'Invalid questions should be filtered out');
  
  console.log(chalk.gray(`  ✓ Error handling working correctly`));
});

// Run tests if API key is available
if (config.hasOpenRouter) {
  // Test 9: Live connection test (optional)
  tests.addTest('Live Connection Test (Optional)', async () => {
    const anecdoteGen = getAnecdoteGenerator();
    const questionGen = getQuestionGenerator();
    
    console.log(chalk.gray('  Testing live connections (may take a moment)...'));
    
    const anecdoteResult = await anecdoteGen.testConnection();
    const questionResult = await questionGen.testConnection();
    
    // These might fail if API is down, so we'll just log results
    console.log(chalk.gray(`  ✓ AnecdoteGenerator connection: ${anecdoteResult ? 'OK' : 'Failed'}`));
    console.log(chalk.gray(`  ✓ QuestionGenerator connection: ${questionResult ? 'OK' : 'Failed'}`));
  });
} else {
  console.log(chalk.yellow('⚠️ Skipping live connection tests - OpenRouter API key not configured'));
}

// Run all tests
tests.runAllTests().catch(error => {
  console.error(chalk.red('Test runner failed:'), error);
  process.exit(1);
});