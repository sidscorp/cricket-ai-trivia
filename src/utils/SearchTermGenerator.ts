/**
 * Search Term Generator
 *
 * Creates a set of templated search queries based on game filters
 * (era, countries, category) for hunting cricket articles.
 */
import { GameFilters, QuestionCategory, CricketCountry } from '../types/Question';

/** Human-readable labels for eras */
const eraLabels: Record<GameFilters['era'], string> = {
  all_eras: 'cricket',
  golden_age: 'pre-1950s cricket',
  post_war_boom: '1950s-1970s cricket',
  world_cup_era: '1970s-1990s cricket',
  modern_era: '2000s-2010s cricket',
  contemporary: '2010s-2019 cricket',
  post_covid: '2020-present cricket',
};

/** Human-readable labels for categories */
const categoryLabels: Record<QuestionCategory, string> = {
  legendary_moments: 'legendary moments',
  player_stories: 'player stories',
  records_stats: 'records and stats',
  rules_formats: 'rules and formats',
  cultural_impact: 'cultural impact',
  tutorial: 'cricket basics',
};

/** Human-readable labels for countries */
const countryLabels: Record<CricketCountry, string> = {
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

/**
 * Generate multiple search query templates based on filters and category.
 * Returns an array of queries to be used with a Custom Search API.
 */
export function generateSearchTerms(
  filters: GameFilters,
  category: QuestionCategory
): string[] {
  const eraPart = eraLabels[filters.era] || eraLabels.all_eras;
  const countryPart =
    filters.countries && filters.countries.length > 0 && filters.countries[0] !== 'all_countries'
      ? filters.countries.map(c => countryLabels[c]).join(' ')
      : '';
  const categoryPart = categoryLabels[category] || '';

  const base = [eraPart, countryPart, categoryPart, 'cricket']
    .filter(Boolean)
    .join(' ');

  // Return a few variations to allow some randomness
  return [
    `${base}`,
    `${base} news`,
    `${base} history`,
    `${base} top stories`,
  ];
}
