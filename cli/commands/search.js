/**
 * Search Command
 *
 * Perform a Google Custom Search and output the article results.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { google } from 'googleapis';

export const searchCommand = new Command('search')
  .description('Run a Google Custom Search and list cricket-related articles')
  .requiredOption('-q, --query <query>', 'Search query string')
  .option('-n, --num <number>', 'Number of results to return (1-10)', '10')
  .option('--start <index>', 'Start index of results (1-based)', '1')
  .option('--json', 'Output raw JSON of search items')
  .action(async (options) => {
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;
    if (!apiKey || !cx) {
      console.error(chalk.red('❌ GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_CX must be set')); 
      process.exit(1);
    }
    const num = Math.min(Math.max(parseInt(options.num, 10) || 10, 1), 10);
    const start = Math.max(parseInt(options.start, 10) || 1, 1);

    console.log(chalk.blue(`
🔍 Google Custom Search: "${options.query}" (num=${num}, start=${start})
`));
    try {
      const customsearch = google.customsearch('v1');
      const res = await customsearch.cse.list({
        auth: apiKey,
        cx,
        q: options.query,
        num,
        start,
      });
      const items = res.data.items || [];
      if (options.json) {
        console.log(JSON.stringify(items, null, 2));
      } else {
        items.forEach((item) => {
          console.log(chalk.green('• ' + (item.title || 'No title')));
          console.log(chalk.cyan(item.link || ''));
          if (item.snippet) console.log('    ' + item.snippet.trim());
          console.log('');
        });
        if (items.length === 0) console.log(chalk.yellow('No results found.'));
      }
    } catch (err) {
      console.error(chalk.red('❌ Search failed:'), err.message);
      process.exit(1);
    }
  });
