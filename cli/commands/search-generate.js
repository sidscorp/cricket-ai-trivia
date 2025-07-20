/**
 * Search-Generate Command
 *
 * Runs a search-driven pipeline: fetch articles via Custom Search,
 * then generate trivia questions based on those articles.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { google } from 'googleapis';
import { config } from '../utils/config.js';
// Inline search-term generator (avoid TS import)
const eraLabels = {
  all_eras: 'cricket',
  golden_age: 'pre-1950s cricket',
  post_war_boom: '1950s-1970s cricket',
  world_cup_era: '1970s-1990s cricket',
  modern_era: '2000s-2010s cricket',
  contemporary: '2010s-2019 cricket',
  post_covid: '2020-present cricket',
};
const categoryLabels = {
  legendary_moments: 'legendary moments',
  player_stories: 'player stories',
  records_stats: 'records and stats',
  rules_formats: 'rules and formats',
  cultural_impact: 'cultural impact',
  tutorial: 'cricket basics',
};
const countryLabels = {
  all_countries: 'global',
  england: 'England',
  australia: 'Australia',
  india: 'India',
  west_indies: 'West Indies',
  pakistan: 'Pakistan',
  south_africa: 'South Africa',
  new_zealand: 'New Zealand',
  sri_lanka: 'Sri Lanka',
};
function generateSearchTerms(filters, category) {
  const eraPart = eraLabels[filters.era] || eraLabels.all_eras;
  const countryPart = filters.countries && filters.countries[0] !== 'all_countries'
    ? filters.countries.map(c => countryLabels[c]).join(' ')
    : '';
  const categoryPart = categoryLabels[category] || '';
  const base = [eraPart, countryPart, categoryPart, 'cricket'].filter(Boolean).join(' ');
  
  // Enhanced search term patterns with dramatic modifiers and engaging variations
  const engagingModifiers = [
    'legendary', 'iconic', 'unforgettable', 'dramatic', 'historic', 'greatest',
    'memorable', 'epic', 'famous', 'controversial', 'stunning', 'incredible'
  ];
  
  // Incident-specific patterns for high-drama content
  const incidentModifiers = [
    'controversial moment', 'turning point', 'dramatic finish', 'record-breaking',
    'underdog victory', 'last-ball thriller', 'historic comeback', 'shock upset',
    'weather-affected', 'abandoned match', 'protest incident', 'technology controversy',
    'nail-biting finish', 'super over', 'tie match', 'debut performance'
  ];
  
  // Multi-angle incident search patterns
  const incidentAngles = [
    'what happened', 'behind the scenes', 'player reactions', 
    'match report', 'statistical significance', 'crowd reaction'
  ];
  
  const searchPatterns = [
    // Original patterns (keep for compatibility)
    base,
    `${base} news`,
    `${base} history`,
    `${base} top stories`,
    
    // Dramatic and engaging patterns
    `${engagingModifiers[Math.floor(Math.random() * engagingModifiers.length)]} ${base}`,
    `${base} ${engagingModifiers[Math.floor(Math.random() * engagingModifiers.length)]} moments`,
    `most ${engagingModifiers[Math.floor(Math.random() * engagingModifiers.length)]} ${base}`,
    
    // Story-focused patterns
    `${base} greatest moments`,
    `${base} turning points`,
    `${base} defining moments`,
    `${base} legendary performances`,
    `${base} iconic matches`,
    `${base} famous incidents`,
    
    // Incident-specific dramatic patterns
    `${base} ${incidentModifiers[Math.floor(Math.random() * incidentModifiers.length)]}`,
    `${incidentModifiers[Math.floor(Math.random() * incidentModifiers.length)]} ${base}`,
    `${base} ${incidentAngles[Math.floor(Math.random() * incidentAngles.length)]}`,
    
    // Temporal and contextual patterns
    `${base} career highlights`,
    `${base} breakthrough moments`,
    `${base} record breaking`,
    `${base} match winning`,
    `${base} championship moments`,
    `${base} rivalry moments`,
    
    // Emotional and dramatic patterns
    `${base} dramatic victories`,
    `${base} stunning comebacks`,
    `${base} controversial decisions`,
    `${base} emotional moments`,
    `${base} pressure situations`,
    `${base} clutch performances`,
    
    // Specific dramatic cricket scenarios
    `${base} last over drama`,
    `${base} rain affected thriller`,
    `${base} DRS controversy`,
    `${base} hat-trick moment`,
    `${base} century under pressure`
  ];
  
  // Shuffle and return random selection of 4-6 search terms for variety
  const shuffled = searchPatterns.sort(() => Math.random() - 0.5);
  const selectionSize = 4 + Math.floor(Math.random() * 3); // 4-6 terms
  return shuffled.slice(0, selectionSize);
}

/**
 * Extract domain from URL for source diversity tracking
 */
function extractSourceDomain(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return 'unknown';
  }
}

/**
 * Diversify source selection to avoid clustering from same sources
 */
function diversifySourceSelection(articles, targetCount) {
  if (articles.length <= targetCount) {
    return articles;
  }

  const selected = [];
  const sourceCount = {};
  const maxPerSource = Math.max(1, Math.floor(targetCount / 3)); // Max 1/3 from same source

  // Priority pass: Select diverse sources first
  for (const article of articles) {
    if (selected.length >= targetCount) break;
    
    const currentSourceCount = sourceCount[article.source] || 0;
    if (currentSourceCount < maxPerSource) {
      selected.push(article);
      sourceCount[article.source] = currentSourceCount + 1;
    }
  }

  // Fill remaining slots if needed
  for (const article of articles) {
    if (selected.length >= targetCount) break;
    if (!selected.includes(article)) {
      selected.push(article);
    }
  }

  return selected.slice(0, targetCount);
}

import { getGeminiService } from '../services/GeminiService.js';

/**
 * Adaptive question generation system with guaranteed minimum output
 */
async function adaptiveQuestionGeneration({ filters, category, targetQuestions, maxArticles }) {
  const gemini = getGeminiService();
  let allQuestions = [];
  let totalGenerated = 0;
  let validated = 0;
  let articleBatchSize = 15;
  let currentArticleCount = 0;
  
  console.log(chalk.blue('\n🔍 Generating search terms from filters...'));
  const terms = generateSearchTerms(filters, category);
  
  while (allQuestions.length < targetQuestions && currentArticleCount < maxArticles) {
    const query = terms[Math.floor(Math.random() * terms.length)];
    console.log(chalk.green(`🔍 Query: "${query}"`));
    
    // Fetch articles adaptively (Google Custom Search max 10 per request)
    const articlesToFetch = Math.min(10, articleBatchSize, maxArticles - currentArticleCount);
    console.log(chalk.blue(`🌐 Fetching ${articlesToFetch} articles... (total: ${currentArticleCount + articlesToFetch}/${maxArticles})`));
    
    const customsearch = google.customsearch('v1');
    const searchParams = {
      auth: config.googleSearch.apiKey,
      cx: config.googleSearch.searchEngineId,
      q: query,
      num: articlesToFetch
    };
    
    const res = await customsearch.cse.list(searchParams);
    
    const items = res.data.items || [];
    if (items.length === 0) {
      console.log(chalk.yellow('⚠️ No more articles found, trying different search terms...'));
      continue;
    }
    
    currentArticleCount += items.length;
    
    // Process and score articles for cricket content quality
    let processedArticles = items.map(i => ({ 
      title: i.title || '', 
      snippet: i.snippet || '', 
      link: i.link || '',
      source: extractSourceDomain(i.link || ''),
      cricketScore: scoreCricketContent(i.title + ' ' + i.snippet)
    }));
    
    // Sort by cricket content quality and shuffle high-quality ones
    processedArticles = processedArticles
      .filter(a => a.cricketScore > 0.3) // Filter out low-quality cricket content
      .sort((a, b) => b.cricketScore - a.cricketScore)
      .sort(() => Math.random() - 0.5); // Shuffle among high-quality articles
    
    if (processedArticles.length === 0) {
      console.log(chalk.yellow('⚠️ No high-quality cricket articles found, expanding search...'));
      continue;
    }
    
    // Apply diverse source sampling
    const selectedArticles = diversifySourceSelection(processedArticles, Math.min(8, processedArticles.length));
    
    // Optimize articles for dramatic content and token efficiency
    const optimizedArticles = optimizeArticlesForContext(selectedArticles);
    
    // Smart batch sizing based on content complexity
    const questionsNeeded = targetQuestions - allQuestions.length;
    const contentTokens = calculateContentTokens(optimizedArticles);
    const smartBatchSize = calculateSmartBatchSize(contentTokens, questionsNeeded);
    
    console.log(chalk.blue(`📝 Generating ${smartBatchSize} questions from ${optimizedArticles.length} articles (${contentTokens} tokens)...`));
    
    try {
      const batchQuestions = await gemini.generateQuestions({
        contextArticles: optimizedArticles,
        count: smartBatchSize,
        category,
        filters
      });
      
      totalGenerated += batchQuestions.length;
      
      if (batchQuestions.length > 0) {
        // Add validation count
        validated += batchQuestions.length;
        allQuestions.push(...batchQuestions);
        console.log(chalk.green(`✅ Generated ${batchQuestions.length} questions (total: ${allQuestions.length})`));
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Generation batch failed: ${error.message}`));
      // Continue to next iteration to try with different articles
    }
    
    // Check if we have enough high-quality questions
    if (allQuestions.length >= targetQuestions) {
      break;
    }
    
    // Increase batch size for next iteration if needed
    articleBatchSize = Math.min(articleBatchSize + 5, 25);
  }
  
  // Select best questions if we have more than needed
  const finalQuestions = allQuestions.length > targetQuestions 
    ? selectBestQuestions(allQuestions, targetQuestions)
    : allQuestions;
  
  return {
    finalQuestions,
    totalGenerated,
    validated,
    articlesProcessed: currentArticleCount
  };
}

/**
 * Calculate approximate token count for content
 */
function calculateContentTokens(articles) {
  const totalContent = articles.reduce((acc, article) => 
    acc + (article.title || '').length + (article.snippet || '').length, 0
  );
  return Math.ceil(totalContent / 4); // Rough approximation: 4 chars per token
}

/**
 * Calculate smart batch size based on content complexity
 */
function calculateSmartBatchSize(contentTokens, questionsNeeded) {
  // Base response budget (leaving room for prompt and response)
  const responseTokenBudget = 2000;
  const promptTokens = 800; // Approximate prompt size
  const availableTokens = responseTokenBudget - promptTokens - contentTokens;
  
  // Each question needs approximately 200 tokens
  const tokensPerQuestion = 200;
  const maxQuestions = Math.floor(availableTokens / tokensPerQuestion);
  
  // Conservative sizing with safety margin
  const safeMaxQuestions = Math.max(1, Math.floor(maxQuestions * 0.8));
  
  // Return the minimum of safe limit and what we need
  return Math.min(safeMaxQuestions, questionsNeeded, 5);
}

/**
 * Optimize articles for key dramatic content while preserving engagement
 */
function optimizeArticlesForContext(articles) {
  return articles.map(article => {
    const title = article.title || '';
    const snippet = article.snippet || '';
    
    // Extract sentences with high drama potential
    const sentences = snippet.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const dramaticSentences = sentences
      .map(sentence => ({
        text: sentence.trim(),
        score: scoreDramaInSentence(sentence)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2) // Keep top 2 dramatic sentences
      .map(s => s.text);
    
    const optimizedSnippet = dramaticSentences.join('. ') + (dramaticSentences.length > 0 ? '.' : '');
    
    return {
      ...article,
      snippet: optimizedSnippet.length > 0 ? optimizedSnippet : snippet.substring(0, 100),
      originalLength: snippet.length,
      optimizedLength: optimizedSnippet.length
    };
  });
}

/**
 * Score individual sentence for dramatic content
 */
function scoreDramaInSentence(sentence) {
  const dramaticWords = [
    'dramatic', 'shocking', 'incredible', 'stunning', 'spectacular',
    'last-ball', 'thriller', 'controversy', 'historic', 'legendary',
    'victory', 'defeat', 'comeback', 'pressure', 'clutch', 'final'
  ];
  
  const lowerSentence = sentence.toLowerCase();
  let score = 0;
  
  dramaticWords.forEach(word => {
    if (lowerSentence.includes(word)) score += 1;
  });
  
  // Bonus for numbers (often indicate specific dramatic moments)
  if (/\d+/.test(sentence)) score += 0.5;
  
  return score;
}

/**
 * Score article content for cricket engagement and story potential
 */
function scoreCricketContent(text) {
  const cricketKeywords = [
    'cricket', 'test', 'odi', 't20', 'match', 'innings', 'wicket', 'runs', 'boundary',
    'bowler', 'batsman', 'captain', 'series', 'tournament', 'world cup', 'ashes',
    'ipl', 'bbl', 'county', 'shield', 'ranji', 'player', 'team', 'squad'
  ];
  
  const dramaticKeywords = [
    'dramatic', 'shocking', 'unexpected', 'thriller', 'nail-biting',
    'historic', 'first-ever', 'last-ball', 'super over', 'tie',
    'controversial', 'stunning', 'incredible', 'unbelievable'
  ];
  
  const narrativeElements = [
    'comeback', 'underdog', 'rivalry', 'controversy', 'record',
    'milestone', 'debut', 'farewell', 'injury', 'weather',
    'protest', 'abandoned', 'emotional', 'pressure', 'clutch'
  ];
  
  const specificIncidents = [
    'hat-trick', 'century', 'maiden over', 'run out', 'stumping',
    'catch', 'dropped catch', 'no-ball', 'wide', 'lbw',
    'drs', 'review', 'umpire', 'decision', 'appeal'
  ];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Base cricket content score
  cricketKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) score += 0.08;
  });
  
  // High bonus for dramatic content (story potential)
  dramaticKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) score += 0.15;
  });
  
  // Bonus for narrative elements
  narrativeElements.forEach(element => {
    if (lowerText.includes(element)) score += 0.1;
  });
  
  // Bonus for specific cricket incidents
  specificIncidents.forEach(incident => {
    if (lowerText.includes(incident)) score += 0.05;
  });
  
  // Extra bonus for multiple dramatic elements
  const dramaticCount = dramaticKeywords.filter(keyword => lowerText.includes(keyword)).length;
  if (dramaticCount >= 2) score += 0.2;
  
  // Score numbers/statistics (often indicate factual incidents)
  const hasNumbers = /\d+/.test(text);
  if (hasNumbers) score += 0.05;
  
  // Score specific years (historical context)
  const hasRecentYear = /(20[0-2]\d|19[8-9]\d)/.test(text);
  if (hasRecentYear) score += 0.05;
  
  return Math.min(score, 2.0); // Allow higher scores for exceptional content
}

/**
 * Select best questions based on variety and quality
 */
function selectBestQuestions(questions, targetCount) {
  // Simple selection for now - can be enhanced with scoring
  return questions
    .sort(() => Math.random() - 0.5) // Shuffle for variety
    .slice(0, targetCount);
}

export const searchGenerateCommand = new Command('search-generate')
  .description('Intelligently fetch articles and generate guaranteed number of trivia questions')
  .option('-e, --era <era>', 'Cricket era filter', 'all_eras')
  .option('-c, --countries <csv>', 'Comma-separated country filters', 'all_countries')
  .option('-g, --category <category>', 'Question category', 'legendary_moments')
  .option('-q, --questions <num>', 'Number of questions to guarantee', '5')
  .option('--max-articles <num>', 'Maximum articles to fetch if needed', '50')
  .option('--json', 'Output raw JSON of generated questions')
  .action(async (options) => {
    try {
      const era = options.era;
      const countries = options.countries.split(',').map(s => s.trim());
      const category = options.category;
      const targetQuestions = Math.max(parseInt(options.questions, 10) || 5, 1);
      const maxArticles = Math.max(parseInt(options.maxArticles, 10) || 50, 15);
      
      console.log(chalk.blue('🎯 Intelligent Question Generation Pipeline'));
      console.log(chalk.green(`Target: ${targetQuestions} guaranteed questions`));

      // Adaptive article collection and question generation system
      const results = await adaptiveQuestionGeneration({
        filters: { era, countries, questionStyle: 'facts_opinions', gameMode: 'fixed' },
        category,
        targetQuestions,
        maxArticles
      });

      if (options.json) {
        console.log(JSON.stringify(results.finalQuestions, null, 2));
      } else {
        console.log(chalk.green(`\n✅ Successfully generated ${results.finalQuestions.length} high-quality questions`));
        console.log(chalk.gray(`📊 Processing stats: ${results.totalGenerated} generated → ${results.validated} validated → ${results.finalQuestions.length} final`));
        
        results.finalQuestions.forEach((q, idx) => {
          console.log(chalk.bold(`\nQuestion ${idx + 1}: ${q.question}`));
          q.options.forEach((opt, j) => {
            console.log(`  ${String.fromCharCode(65 + j)}. ${opt}`);
          });
          console.log(chalk.yellow(`  Answer: ${String.fromCharCode(65 + q.correctAnswer)}`));
          console.log(chalk.cyan(`  Source: ${q.source}\n`));
        });
      }
    } catch (err) {
      console.error(chalk.red('\n❌ Search-generate pipeline failed:'), err.message);
      process.exit(1);
    }
  });
