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
  return [base, `${base} news`, `${base} history`, `${base} top stories`];
}
import { getGeminiService } from '../services/GeminiService.js';

export const searchGenerateCommand = new Command('search-generate')
  .description('Fetch articles using filters, then generate trivia questions from them')
  .option('-e, --era <era>', 'Cricket era filter', 'all_eras')
  .option('-c, --countries <csv>', 'Comma-separated country filters', 'all_countries')
  .option('-g, --category <category>', 'Question category', 'legendary_moments')
  .option('-a, --articles <num>', 'Number of articles to fetch', '15')
  .option('-q, --questions <num>', 'Number of questions to generate', '10')
  .option('--json', 'Output raw JSON of generated questions')
  .action(async (options) => {
    try {
      const era = options.era;
      const countries = options.countries.split(',').map(s => s.trim());
      const category = options.category;
      const numArticles = Math.max(parseInt(options.articles, 10) || 15, 1);
      const numQuestions = Math.max(parseInt(options.questions, 10) || 10, 1);

      console.log(chalk.blue('\n🔍 Generating search terms from filters...'));
      const filters = { era, countries, questionStyle: 'facts_opinions', gameMode: 'fixed' };
      const terms = generateSearchTerms(filters, category);
      const query = terms[Math.floor(Math.random() * terms.length)];
      console.log(chalk.green(`Query: "${query}"`));

      console.log(chalk.blue(`\n🌐 Fetching top ${numArticles} articles...`));
      const customsearch = google.customsearch('v1');
      const res = await customsearch.cse.list({
        auth: config.googleSearch.apiKey,
        cx: config.googleSearch.searchEngineId,
        q: query,
        num: numArticles,
      });
      const items = res.data.items || [];
      if (items.length === 0) {
        console.error(chalk.red('❌ No articles found for this query.'));
        process.exit(1);
      }
      const articles = items.map(i => ({ title: i.title || '', snippet: i.snippet || '', link: i.link || '' }));

      console.log(chalk.blue(`\n📝 Generating ${numQuestions} trivia questions from articles...`));
      const gemini = getGeminiService();
      const questions = await gemini.generateQuestions({
        contextArticles: articles,
        count: numQuestions,
      });

      if (options.json) {
        console.log(JSON.stringify(questions, null, 2));
      } else {
        questions.forEach((q, idx) => {
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
