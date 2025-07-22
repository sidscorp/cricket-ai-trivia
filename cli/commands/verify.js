/**
 * Verify Command
 * 
 * Test web verification of cricket incidents using Google Custom Search
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { GoogleSearchService } from '../services/google-search.js';
import { getOpenRouterService } from '../../shared/services/OpenRouterService.js';
import { PerformanceMonitor } from '../utils/performance.js';

export const verifyCommand = new Command('verify')
  .description('Test web verification of cricket incidents')
  .option('-i, --incident <text>', 'Incident text to verify')
  .option('-g, --generate', 'Generate incident first, then verify')
  .option('-s, --show-sources', 'Show detailed source information')
  .option('-c, --confidence <threshold>', 'Minimum confidence threshold (0-100)', '60')
  .option('--json', 'Output results as JSON')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n🔍 Cricket Verification Test'));
      console.log(chalk.blue('═══════════════════════════'));

      const searchService = new GoogleSearchService();
      const monitor = new PerformanceMonitor();

      let incident;

      if (options.generate) {
        // Generate an incident first using OpenRouter
        const openRouterService = getOpenRouterService();
        console.log(chalk.cyan('\n📝 Generating incident for verification...'));
        
        // Use OpenRouter to generate a cricket incident
        const prompt = `Generate a specific, verifiable cricket incident that actually happened. 
Return it in this JSON format:
{
  "incident": "Detailed description of the cricket incident",
  "summary": "Brief summary (max 100 chars)"
}`;
        
        const response = await openRouterService.callOpenRouterAPI({
          model: openRouterService.models.creative.claude3Sonnet,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        });
        
        const content = response.choices[0].message.content;
        incident = openRouterService.extractJSONFromContent(content);
        console.log(chalk.gray(`Generated: "${incident.summary}"`));
      } else if (options.incident) {
        // Use provided incident
        incident = {
          incident: options.incident,
          summary: options.incident.substring(0, 100) + '...'
        };
      } else {
        // Interactive incident input
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'incident',
            message: 'Enter cricket incident to verify:',
            validate: input => input.trim().length > 10 || 'Please enter a more detailed incident'
          }
        ]);
        incident = {
          incident: answer.incident,
          summary: answer.incident.substring(0, 100) + '...'
        };
      }

      await verifyIncident(
        searchService, 
        incident, 
        monitor, 
        {
          showSources: options.showSources,
          confidenceThreshold: parseInt(options.confidence),
          jsonOutput: options.json
        }
      );

    } catch (error) {
      console.error(chalk.red('\n❌ Verification failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Verify cricket incident using web search
 */
async function verifyIncident(searchService, incident, monitor, options) {
  monitor.start('Cricket Incident Verification');
  
  try {
    monitor.step('Preparing search query');
    
    const searchResults = await searchService.searchCricketIncident(incident.incident, {
      includeContext: true
    });
    
    monitor.step('Search completed');
    monitor.step('Processing and scoring results');
    
    const verification = analyzeVerification(searchResults, options.confidenceThreshold);
    monitor.step('Verification analysis complete');
    
    const metrics = monitor.end();

    if (options.jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        incident: incident,
        verification: verification,
        searchResults: searchResults,
        performance: metrics,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      displayVerificationResults(incident, verification, searchResults, metrics, options);
    }

  } catch (error) {
    monitor.end();
    throw error;
  }
}

/**
 * Analyze verification results
 */
function analyzeVerification(searchResults, confidenceThreshold) {
  if (!searchResults.success) {
    return {
      verified: false,
      confidence: 0,
      reason: 'Search failed',
      sources: []
    };
  }

  const confidence = searchResults.confidence;
  const verified = confidence >= confidenceThreshold;
  
  // Get best sources
  const goodSources = searchResults.items
    .filter(item => item.score >= 70)
    .slice(0, 3);
  
  const allSources = searchResults.items.slice(0, 5);

  let reason;
  if (verified) {
    reason = goodSources.length > 0 
      ? `Found ${goodSources.length} high-quality sources supporting the incident`
      : 'General web search confirms incident details';
  } else {
    if (searchResults.items.length === 0) {
      reason = 'No relevant search results found';
    } else if (confidence < 30) {
      reason = 'Search results show poor relevance to the incident';
    } else {
      reason = 'Search results show moderate relevance but below confidence threshold';
    }
  }

  return {
    verified,
    confidence,
    reason,
    sources: allSources,
    bestSources: goodSources,
    totalResults: searchResults.totalResults
  };
}

/**
 * Display verification results
 */
function displayVerificationResults(incident, verification, searchResults, metrics, options) {
  // Verification status
  const statusIcon = verification.verified ? '✅' : '❌';
  const statusColor = verification.verified ? chalk.green : chalk.red;
  const statusText = verification.verified ? 'VERIFIED' : 'UNVERIFIED';
  
  console.log(chalk.blue('\n📊 Verification Results:'));
  console.log(chalk.blue('═══════════════════════'));
  
  console.log(`\n${statusIcon} Status: ${statusColor.bold(statusText)}`);
  console.log(`🎯 Confidence: ${getConfidenceColor(verification.confidence)(`${verification.confidence}%`)}`);
  console.log(`💭 Reason: ${chalk.gray(verification.reason)}`);
  console.log(`📊 Total Results: ${chalk.cyan(verification.totalResults || 0)}`);

  // Incident summary
  console.log(chalk.blue('\n📖 Verified Incident:'));
  console.log(chalk.blue('═══════════════════'));
  console.log(`   ${chalk.white(incident.summary)}`);

  // Best sources
  if (verification.bestSources && verification.bestSources.length > 0) {
    console.log(chalk.blue('\n🌟 High-Quality Sources:'));
    console.log(chalk.blue('═══════════════════════'));
    
    verification.bestSources.forEach((source, index) => {
      console.log(`\n${index + 1}. ${chalk.green(source.title)}`);
      console.log(`   🔗 ${chalk.blue(source.link)}`);
      console.log(`   📊 Score: ${chalk.yellow(source.score)}/100`);
      console.log(`   📝 ${chalk.gray(source.snippet)}`);
    });
  }

  // All sources (if requested)
  if (options.showSources && verification.sources.length > 0) {
    console.log(chalk.blue('\n📋 All Search Results:'));
    console.log(chalk.blue('══════════════════════'));
    
    verification.sources.forEach((source, index) => {
      const scoreColor = source.score >= 70 ? chalk.green : source.score >= 50 ? chalk.yellow : chalk.red;
      
      console.log(`\n${index + 1}. ${chalk.white(source.title)}`);
      console.log(`   🔗 ${chalk.blue(source.displayLink)}`);
      console.log(`   📊 Score: ${scoreColor(source.score)}/100`);
      
      if (source.factors) {
        console.log(`   📈 Factors: Credibility: ${Math.round(source.factors.sourceCredibility * 100)}%, ` +
                   `Relevance: ${Math.round(source.factors.contentRelevance * 100)}%, ` +
                   `Authority: ${Math.round(source.factors.authority * 100)}%`);
      }
      
      console.log(`   📝 ${chalk.gray(source.snippet.substring(0, 100))}...`);
    });
  }

  // Recommendations
  console.log(chalk.blue('\n💡 Recommendations:'));
  console.log(chalk.blue('═══════════════════'));
  
  if (verification.verified) {
    console.log(`   ✅ ${chalk.green('This incident appears to be factually accurate')}`);
    if (verification.confidence < 80) {
      console.log(`   💡 ${chalk.yellow('Consider adding more specific details for higher confidence')}`);
    }
  } else {
    console.log(`   ❌ ${chalk.red('This incident could not be verified')}`);
    console.log(`   💡 ${chalk.yellow('Try modifying the incident with more specific details:')}`);
    console.log(`      • Add specific dates, venues, or player names`);
    console.log(`      • Include match scores or tournament names`);
    console.log(`      • Focus on well-documented cricket events`);
  }
}

/**
 * Get color for confidence score
 */
function getConfidenceColor(confidence) {
  if (confidence >= 80) return chalk.green;
  if (confidence >= 60) return chalk.yellow;
  if (confidence >= 40) return chalk.red;
  return chalk.red.dim;
}