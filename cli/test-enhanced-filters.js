#!/usr/bin/env node

/**
 * Test Enhanced Filter System
 * 
 * Tests the new enhanced filter system with various scenarios
 * and demonstrates the randomization capabilities.
 */

import chalk from 'chalk';
import { getEnhancedFilterSystem } from './utils/enhanced-filters.js';

async function testEnhancedFilters() {
  console.log(chalk.blue('🎯 Testing Enhanced Filter System...\n'));
  
  const filterSystem = getEnhancedFilterSystem();
  
  // Test 1: Basic filter enhancement
  console.log(chalk.yellow('=== Test 1: Basic Filter Enhancement ==='));
  const basicFilters = {
    era: 'modern_era',
    countries: ['india', 'australia']
  };
  
  const enhanced1 = filterSystem.generateEnhancedFilters(basicFilters, 'legendary_moments');
  console.log(chalk.green('Enhanced filters generated:'));
  console.log(chalk.gray(JSON.stringify(enhanced1, null, 2)));
  console.log();
  
  // Test 2: Search context generation
  console.log(chalk.yellow('=== Test 2: Search Context Generation ==='));
  const searchContext = filterSystem.filtersToSearchContext(enhanced1);
  console.log(chalk.green('Search context:'));
  console.log(chalk.gray(searchContext));
  console.log();
  
  // Test 3: Multiple generations for randomness verification
  console.log(chalk.yellow('=== Test 3: Randomness Verification (5 iterations) ==='));
  for (let i = 0; i < 5; i++) {
    console.log(chalk.cyan(`--- Iteration ${i + 1} ---`));
    const enhanced = filterSystem.generateEnhancedFilters(basicFilters, 'legendary_moments');
    
    console.log(chalk.gray(`Match Type: ${enhanced.matchType}`));
    console.log(chalk.gray(`Conditions: ${enhanced.conditions}`));
    console.log(chalk.gray(`Tournament: ${enhanced.tournament}`));
    console.log(chalk.gray(`Player Role: ${enhanced.playerRole}`));
    console.log(chalk.gray(`Narrative Angle: ${enhanced.narrative?.angle}`));
    console.log(chalk.gray(`Emotional Tone: ${enhanced.emotional?.intensity}`));
    console.log(chalk.gray(`Search Seed: ${enhanced.searchSeed}`));
    console.log();
  }
  
  // Test 4: Different categories
  console.log(chalk.yellow('=== Test 4: Different Categories ==='));
  const categories = ['legendary_moments', 'player_stories', 'records_stats', 'cultural_impact'];
  
  for (const category of categories) {
    console.log(chalk.cyan(`--- Category: ${category} ---`));
    const enhanced = filterSystem.generateEnhancedFilters(basicFilters, category);
    console.log(chalk.gray(`Category Focus: ${enhanced.narrative?.categoryFocus}`));
    console.log(chalk.gray(`Technical Aspect: ${enhanced.technical?.aspect}`));
    console.log();
  }
  
  // Test 5: Different base filters
  console.log(chalk.yellow('=== Test 5: Different Base Filters ==='));
  
  const testScenarios = [
    {
      name: 'All Eras, Global',
      filters: { era: 'all_eras', countries: ['all_countries'] }
    },
    {
      name: 'Golden Age, England',
      filters: { era: 'golden_age', countries: ['england'] }
    },
    {
      name: 'Contemporary, Subcontinent',
      filters: { era: 'contemporary', countries: ['india', 'pakistan', 'sri_lanka'] }
    },
    {
      name: 'Post-COVID, Big Three',
      filters: { era: 'post_covid', countries: ['england', 'australia', 'india'] }
    }
  ];
  
  for (const scenario of testScenarios) {
    console.log(chalk.cyan(`--- ${scenario.name} ---`));
    const enhanced = filterSystem.generateEnhancedFilters(scenario.filters, 'legendary_moments');
    console.log(chalk.gray(`Era Context: ${enhanced.eraContext}`));
    console.log(chalk.gray(`Country Context: ${enhanced.countryContext}`));
    console.log(chalk.gray(`Temporal Context: ${enhanced.temporal?.context}`));
    console.log();
  }
  
  // Test 6: Filter system performance
  console.log(chalk.yellow('=== Test 6: Performance Test ==='));
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    filterSystem.generateEnhancedFilters(basicFilters, 'legendary_moments');
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / 100;
  
  console.log(chalk.green(`Generated 100 enhanced filters in ${endTime - startTime}ms`));
  console.log(chalk.green(`Average time per generation: ${avgTime.toFixed(2)}ms`));
  console.log();
  
  // Test 7: Uniqueness verification
  console.log(chalk.yellow('=== Test 7: Uniqueness Verification ==='));
  const uniqueSeeds = new Set();
  const uniqueContexts = new Set();
  
  for (let i = 0; i < 50; i++) {
    const enhanced = filterSystem.generateEnhancedFilters(basicFilters, 'legendary_moments');
    uniqueSeeds.add(enhanced.searchSeed);
    
    const contextKey = `${enhanced.matchType}-${enhanced.conditions}-${enhanced.tournament}`;
    uniqueContexts.add(contextKey);
  }
  
  console.log(chalk.green(`Generated 50 filters:`));
  console.log(chalk.green(`  Unique search seeds: ${uniqueSeeds.size}/50 (${(uniqueSeeds.size/50*100).toFixed(1)}%)`));
  console.log(chalk.green(`  Unique contexts: ${uniqueContexts.size}/50 (${(uniqueContexts.size/50*100).toFixed(1)}%)`));
  console.log();
  
  // Test 8: Integration test
  console.log(chalk.yellow('=== Test 8: Integration Test ==='));
  console.log(chalk.gray('Testing integration with AnecdoteGenerator...'));
  
  try {
    const { getAnecdoteGenerator } = await import('./services/AnecdoteGenerator.js');
    const anecdoteGen = getAnecdoteGenerator();
    
    // Test enhanced filter integration
    const testFilters = { era: 'modern_era', countries: ['india'] };
    const enhancedForAnecdotes = anecdoteGen.enhanceFilters(testFilters, 'legendary_moments');
    
    console.log(chalk.green('✅ Integration with AnecdoteGenerator successful'));
    console.log(chalk.gray(`Generated search seed: ${enhancedForAnecdotes.searchSeed}`));
    console.log(chalk.gray(`Enhanced match type: ${enhancedForAnecdotes.matchType}`));
    
  } catch (error) {
    console.log(chalk.red(`❌ Integration test failed: ${error.message}`));
  }
  
  console.log();
  console.log(chalk.blue('🎉 Enhanced Filter System testing complete!'));
}

// Run the tests
testEnhancedFilters().catch(error => {
  console.error(chalk.red('Test failed:'), error);
  process.exit(1);
});