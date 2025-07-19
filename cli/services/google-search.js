/**
 * Google Custom Search Service
 * 
 * Provides web search capabilities to verify AI-generated cricket incidents
 * and enhance question accuracy through real-world validation.
 */

import { google } from 'googleapis';
import chalk from 'chalk';
import { config } from '../utils/config.js';

export class GoogleSearchService {
  constructor() {
    this.customsearch = google.customsearch('v1');
    this.config = config.googleSearch;
    this.cricketContext = config.cricketContext;
    this.enabled = !!(this.config.apiKey && this.config.searchEngineId);
  }

  /**
   * Search for cricket-related information to verify incidents
   */
  async searchCricketIncident(incident, options = {}) {
    if (!this.enabled) {
      console.log(chalk.yellow(`   ⚠️  Search skipped - Google Custom Search not configured`));
      return {
        success: false,
        error: 'Google Custom Search not configured',
        items: [],
        confidence: 0,
        skipped: true
      };
    }

    try {
      const searchQuery = this.buildSearchQuery(incident, options);
      console.log(chalk.gray(`   🔍 Searching: "${searchQuery}"`));

      const searchParams = {
        auth: this.config.apiKey,
        cx: this.config.searchEngineId,
        q: searchQuery,
        num: this.config.maxResults,
        safe: 'active',
        ...options.searchParams
      };

      const response = await this.customsearch.cse.list(searchParams);
      const results = this.processSearchResults(response.data, incident);

      console.log(chalk.gray(`   📊 Found ${results.items.length} results`));
      return results;

    } catch (error) {
      console.error(chalk.red(`   ❌ Search error: ${error.message}`));
      return {
        success: false,
        error: error.message,
        items: [],
        confidence: 0
      };
    }
  }

  /**
   * Build optimized search query for cricket incidents
   */
  buildSearchQuery(incident, options = {}) {
    const { searchTerms } = this.cricketContext;
    const baseTerms = options.includeContext !== false ? ['cricket'] : [];
    
    // Extract key elements from incident
    const keyTerms = this.extractKeyTerms(incident);
    
    // Combine terms intelligently
    const query = [
      ...baseTerms,
      ...keyTerms,
      ...(options.additionalTerms || [])
    ].join(' ');

    return query.substring(0, 200); // Google search query limit
  }

  /**
   * Extract key search terms from cricket incident
   */
  extractKeyTerms(incident) {
    const terms = [];
    
    // Extract player names (capitalize words that look like names)
    const playerMatches = incident.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g);
    if (playerMatches) {
      terms.push(...playerMatches.slice(0, 2)); // Max 2 player names
    }

    // Extract years
    const yearMatches = incident.match(/\b(19|20)\d{2}\b/g);
    if (yearMatches) {
      terms.push(...yearMatches.slice(0, 1)); // Max 1 year
    }

    // Extract cricket-specific terms
    const cricketTerms = [
      'Test', 'ODI', 'T20', 'World Cup', 'Ashes', 'IPL', 'County',
      'wicket', 'century', 'fifty', 'maiden', 'hat-trick', 'boundary',
      'Lord\'s', 'MCG', 'Eden Gardens', 'Oval', 'Wankhede'
    ];

    cricketTerms.forEach(term => {
      if (incident.toLowerCase().includes(term.toLowerCase())) {
        terms.push(term);
      }
    });

    // Extract quoted phrases (likely important specific incidents)
    const quotedMatches = incident.match(/"([^"]+)"/g);
    if (quotedMatches) {
      terms.push(...quotedMatches.map(q => q.replace(/"/g, '')));
    }

    return terms.slice(0, 5); // Limit total terms for query efficiency
  }

  /**
   * Process and score search results
   */
  processSearchResults(data, originalIncident) {
    const items = data.items || [];
    const searchInfo = data.searchInformation || {};

    const processedItems = items.map(item => this.scoreSearchResult(item, originalIncident));
    
    // Calculate overall confidence based on results
    const confidence = this.calculateConfidence(processedItems, searchInfo);

    return {
      success: true,
      items: processedItems,
      confidence: confidence,
      totalResults: searchInfo.totalResults || 0,
      searchTime: searchInfo.searchTime || 0,
      originalIncident: originalIncident
    };
  }

  /**
   * Score individual search result for relevance and credibility
   */
  scoreSearchResult(item, originalIncident) {
    let score = 0;
    const factors = {};

    // Source credibility (30% of score)
    const sourceScore = this.getSourceCredibilityScore(item.link);
    factors.sourceCredibility = sourceScore;
    score += sourceScore * 0.3;

    // Content relevance (40% of score)
    const relevanceScore = this.getRelevanceScore(item, originalIncident);
    factors.contentRelevance = relevanceScore;
    score += relevanceScore * 0.4;

    // Freshness and authority (30% of score)
    const authorityScore = this.getAuthorityScore(item);
    factors.authority = authorityScore;
    score += authorityScore * 0.3;

    return {
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
      score: Math.round(score * 100),
      factors: factors,
      raw: item
    };
  }

  /**
   * Calculate source credibility score
   */
  getSourceCredibilityScore(url) {
    const { trustedSources } = this.cricketContext;
    const domain = this.extractDomain(url);

    // Check against trusted cricket sources
    for (const source of trustedSources) {
      if (domain.includes(source)) {
        return 1.0; // Maximum credibility
      }
    }

    // Check for other credible indicators
    if (domain.includes('bbc.') || domain.includes('cnn.') || domain.includes('reuters.')) {
      return 0.8; // High credibility news sources
    }

    if (domain.includes('wikipedia.')) {
      return 0.6; // Moderate credibility
    }

    if (domain.includes('.edu') || domain.includes('.org')) {
      return 0.7; // Educational/organizational sources
    }

    return 0.3; // Default low credibility
  }

  /**
   * Calculate content relevance score
   */
  getRelevanceScore(item, originalIncident) {
    const content = `${item.title} ${item.snippet}`.toLowerCase();
    const incident = originalIncident.toLowerCase();

    let score = 0;

    // Direct keyword matches
    const keywords = incident.split(' ').filter(word => word.length > 3);
    const matchCount = keywords.filter(keyword => content.includes(keyword)).length;
    score += (matchCount / keywords.length) * 0.5;

    // Cricket-specific terms
    const cricketTerms = ['cricket', 'match', 'player', 'team', 'innings', 'bowling', 'batting'];
    const cricketMatches = cricketTerms.filter(term => content.includes(term)).length;
    score += (cricketMatches / cricketTerms.length) * 0.3;

    // Year/date relevance
    const years = incident.match(/\b(19|20)\d{2}\b/g) || [];
    const hasYearMatch = years.some(year => content.includes(year));
    if (hasYearMatch) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate authority score based on various factors
   */
  getAuthorityScore(item) {
    let score = 0;

    // Check for structured data or detailed content
    if (item.snippet && item.snippet.length > 100) {
      score += 0.3;
    }

    // Check for dates in snippet (indicates factual reporting)
    if (item.snippet && item.snippet.match(/\b(19|20)\d{2}\b/)) {
      score += 0.3;
    }

    // Check title quality
    if (item.title && item.title.length > 20 && item.title.length < 100) {
      score += 0.2;
    }

    // Check for official-looking content
    if (item.snippet && (item.snippet.includes('official') || item.snippet.includes('record'))) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidence(items, searchInfo) {
    if (items.length === 0) return 0;

    // Base confidence from top results
    const topResults = items.slice(0, 3);
    const avgScore = topResults.reduce((sum, item) => sum + item.score, 0) / topResults.length;

    // Boost confidence if multiple high-quality sources agree
    const highQualityResults = items.filter(item => item.score > 70);
    const qualityBoost = Math.min(highQualityResults.length * 0.1, 0.3);

    // Boost confidence if we have many total results
    const totalResults = parseInt(searchInfo.totalResults) || 0;
    const quantityBoost = totalResults > 1000 ? 0.1 : totalResults > 100 ? 0.05 : 0;

    const finalConfidence = Math.min((avgScore / 100) + qualityBoost + quantityBoost, 1.0);
    return Math.round(finalConfidence * 100);
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * Get the best source link from search results
   */
  getBestSource(searchResults) {
    if (!searchResults.success || searchResults.items.length === 0) {
      return null;
    }

    // Return the highest scoring result
    const bestResult = searchResults.items.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      url: bestResult.link,
      title: bestResult.title,
      score: bestResult.score,
      snippet: bestResult.snippet
    };
  }
}