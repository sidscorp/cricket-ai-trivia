/**
 * Enhanced Filter System for V2 Pipeline
 * 
 * Provides advanced filtering capabilities with randomization and contextual variations
 * to ensure unique content generation on every call.
 */

import chalk from 'chalk';

export class EnhancedFilterSystem {
  constructor() {
    this.filterDimensions = this.initializeFilterDimensions();
    this.randomizationStrategies = this.initializeRandomizationStrategies();
  }

  /**
   * Initialize all filter dimensions
   */
  initializeFilterDimensions() {
    return {
      // Extended era filters with sub-periods
      era: {
        all_eras: 'cricket across all time periods',
        golden_age: {
          label: 'pre-1950s cricket',
          subperiods: ['early cricket', 'foundation years', 'amateur era', 'wartime cricket']
        },
        post_war_boom: {
          label: '1950s-1970s cricket', 
          subperiods: ['post-war revival', 'test expansion', 'county growth', 'emerging nations']
        },
        world_cup_era: {
          label: '1970s-1990s cricket',
          subperiods: ['ODI birth', 'world cup early years', 'WSC revolution', 'professionalization']
        },
        modern_era: {
          label: '2000s-2010s cricket',
          subperiods: ['T20 birth', 'IPL emergence', 'technology integration', 'global expansion']
        },
        contemporary: {
          label: '2010s-2019 cricket',
          subperiods: ['franchise cricket boom', 'bilateral series decline', 'format evolution']
        },
        post_covid: {
          label: '2020-present cricket',
          subperiods: ['bio-bubble cricket', 'schedule chaos', 'player welfare focus', 'streaming revolution']
        }
      },

      // Enhanced country filters with regional groupings
      countries: {
        all_countries: 'global cricket',
        // Traditional powers
        big_three: ['england', 'australia', 'india'],
        asian_powerhouses: ['india', 'pakistan', 'sri_lanka'],
        commonwealth_rivals: ['england', 'australia', 'south_africa', 'new_zealand'],
        subcontinent: ['india', 'pakistan', 'sri_lanka', 'bangladesh'],
        // Individual countries
        england: 'England',
        australia: 'Australia',
        india: 'India',
        west_indies: 'West Indies',
        pakistan: 'Pakistan',
        south_africa: 'South Africa',
        new_zealand: 'New Zealand',
        sri_lanka: 'Sri Lanka',
        bangladesh: 'Bangladesh',
        afghanistan: 'Afghanistan',
        ireland: 'Ireland',
        zimbabwe: 'Zimbabwe'
      },

      // New match type filters
      matchType: {
        all_formats: 'all cricket formats',
        test: {
          label: 'Test cricket',
          variations: ['5-day tests', 'timeless tests', 'day-night tests', 'pink ball tests']
        },
        odi: {
          label: 'One Day Internationals',
          variations: ['50-over ODIs', 'world cup matches', 'bilateral ODIs', 'series deciders']
        },
        t20: {
          label: 'T20 cricket',
          variations: ['T20 internationals', 'franchise cricket', 'world cup T20s', 'domestic T20s']
        },
        first_class: {
          label: 'First-class cricket',
          variations: ['county cricket', 'shield cricket', 'ranji trophy', 'plunket shield']
        },
        list_a: {
          label: 'List A cricket',
          variations: ['domestic one-day', 'cup competitions', 'regional tournaments']
        }
      },

      // New playing conditions filters
      conditions: {
        all_conditions: 'all playing conditions',
        day_night: {
          label: 'Day-night matches',
          variations: ['pink ball tests', 'floodlit ODIs', 'evening T20s', 'twilight sessions']
        },
        weather_affected: {
          label: 'Weather-affected matches',
          variations: ['rain delays', 'abandoned matches', 'reduced overs', 'duckworth-lewis']
        },
        spin_friendly: {
          label: 'Spin-friendly conditions',
          variations: ['turning tracks', 'subcontinental pitches', 'dry surfaces', 'dusty wickets']
        },
        pace_friendly: {
          label: 'Pace-friendly conditions',
          variations: ['green tops', 'bouncy tracks', 'seaming conditions', 'fast outfields']
        },
        batting_paradise: {
          label: 'Batting-friendly conditions',
          variations: ['flat tracks', 'small boundaries', 'high scores', 'road pitches']
        }
      },

      // New tournament/series filters
      tournament: {
        all_tournaments: 'all cricket competitions',
        world_cup: {
          label: 'World Cup cricket',
          variations: ['50-over world cups', 'T20 world cups', 'womens world cups', 'under-19 world cups']
        },
        ashes: {
          label: 'The Ashes',
          variations: ['ashes in england', 'ashes in australia', 'ashes series', 'ashes moments']
        },
        ipl: {
          label: 'Indian Premier League',
          variations: ['IPL seasons', 'IPL playoffs', 'IPL auctions', 'IPL records']
        },
        bilateral: {
          label: 'Bilateral series',
          variations: ['test series', 'ODI series', 'T20 series', 'multi-format series']
        },
        domestic: {
          label: 'Domestic cricket',
          variations: ['county championship', 'sheffield shield', 'ranji trophy', 'big bash']
        }
      },

      // New player role filters
      playerRole: {
        all_roles: 'all player roles',
        batsman: {
          label: 'Batsmen',
          variations: ['openers', 'middle order', 'finishers', 'anchors', 'strokemakers']
        },
        bowler: {
          label: 'Bowlers', 
          variations: ['fast bowlers', 'spinners', 'swing bowlers', 'death bowlers', 'new ball bowlers']
        },
        all_rounder: {
          label: 'All-rounders',
          variations: ['batting all-rounders', 'bowling all-rounders', 'genuine all-rounders']
        },
        wicket_keeper: {
          label: 'Wicket-keepers',
          variations: ['keeper-batsmen', 'specialist keepers', 'captain-keepers']
        },
        captain: {
          label: 'Captains',
          variations: ['tactical captains', 'inspirational leaders', 'young captains', 'veteran captains']
        }
      }
    };
  }

  /**
   * Initialize randomization strategies
   */
  initializeRandomizationStrategies() {
    return {
      temporal: {
        timeOfDay: ['morning', 'afternoon', 'evening', 'night'],
        dayOfWeek: ['weekday', 'weekend', 'monday', 'friday'],
        season: ['summer', 'winter', 'monsoon', 'spring'],
        monthContext: ['january', 'march', 'june', 'october', 'december']
      },
      emotional: {
        intensity: ['high-pressure', 'relaxed', 'tense', 'celebratory', 'dramatic'],
        stakes: ['crucial', 'decisive', 'career-defining', 'historic', 'memorable'],
        atmosphere: ['electric', 'subdued', 'partisan', 'neutral', 'hostile']
      },
      narrative: {
        angle: ['underdog story', 'comeback tale', 'dominant performance', 'controversial moment', 'breakthrough'],
        perspective: ['fan favorite', 'statistical significance', 'tactical brilliance', 'individual heroics', 'team effort'],
        drama: ['last-minute', 'unexpected', 'long-awaited', 'stunning', 'inevitable']
      },
      technical: {
        aspect: ['batting technique', 'bowling strategy', 'fielding excellence', 'tactical decisions', 'mental strength'],
        innovation: ['new technique', 'tactical evolution', 'equipment change', 'rule adaptation', 'format innovation'],
        analysis: ['statistical breakdown', 'performance analysis', 'trend identification', 'record comparison']
      }
    };
  }

  /**
   * Generate enhanced filters with maximum randomization
   * @param {Object} baseFilters - Base filters from user input
   * @param {string} category - Question category
   * @returns {Object} Enhanced filters with randomization
   */
  generateEnhancedFilters(baseFilters = {}, category = 'legendary_moments') {
    const timestamp = Date.now();
    const randomSeed = Math.random();
    
    console.log(chalk.gray(`🎲 Generating enhanced filters with seed: ${randomSeed.toString(36).substring(2, 8)}`));
    
    // Start with base filters
    const enhanced = { ...baseFilters };
    
    // Add enhanced era context
    enhanced.eraContext = this.enhanceEraFilter(baseFilters.era, randomSeed);
    
    // Add enhanced country context
    enhanced.countryContext = this.enhanceCountryFilter(baseFilters.countries, randomSeed);
    
    // Add new filter dimensions
    enhanced.matchType = this.selectRandomMatchType(randomSeed);
    enhanced.conditions = this.selectRandomConditions(randomSeed);
    enhanced.tournament = this.selectRandomTournament(randomSeed);
    enhanced.playerRole = this.selectRandomPlayerRole(randomSeed);
    
    // Add randomization elements
    enhanced.temporal = this.generateTemporalVariations(timestamp, randomSeed);
    enhanced.emotional = this.generateEmotionalVariations(randomSeed);
    enhanced.narrative = this.generateNarrativeVariations(category, randomSeed);
    enhanced.technical = this.generateTechnicalVariations(randomSeed);
    
    // Add uniqueness markers
    enhanced.searchSeed = `${timestamp}-${randomSeed.toString(36).substring(2, 8)}`;
    enhanced.generationId = `v2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    return enhanced;
  }

  /**
   * Enhance era filter with sub-periods
   */
  enhanceEraFilter(era, randomSeed) {
    if (!era || era === 'all_eras') {
      return 'cricket across all eras with varied historical contexts';
    }
    
    const eraConfig = this.filterDimensions.era[era];
    if (typeof eraConfig === 'object' && eraConfig.subperiods) {
      const subperiod = eraConfig.subperiods[Math.floor(randomSeed * eraConfig.subperiods.length)];
      return `${eraConfig.label} focusing on ${subperiod}`;
    }
    
    return typeof eraConfig === 'string' ? eraConfig : era;
  }

  /**
   * Enhance country filter with regional contexts
   */
  enhanceCountryFilter(countries, randomSeed) {
    if (!countries || countries.includes('all_countries')) {
      return 'global cricket with diverse regional perspectives';
    }
    
    // Check for regional groupings
    if (countries.length === 1) {
      const country = countries[0];
      const countryConfig = this.filterDimensions.countries[country];
      return typeof countryConfig === 'string' ? countryConfig : country;
    }
    
    // Multiple countries - add regional context
    const regionContext = this.identifyRegionalContext(countries);
    return `${countries.map(c => this.filterDimensions.countries[c] || c).join(', ')} with ${regionContext} rivalry focus`;
  }

  /**
   * Identify regional context for multiple countries
   */
  identifyRegionalContext(countries) {
    const regions = this.filterDimensions.countries;
    
    if (this.arraysEqual(countries.sort(), regions.big_three.sort())) return 'big three';
    if (this.arraysEqual(countries.sort(), regions.asian_powerhouses.sort())) return 'asian powerhouse';
    if (this.arraysEqual(countries.sort(), regions.subcontinent.sort())) return 'subcontinental';
    if (countries.every(c => regions.commonwealth_rivals.includes(c))) return 'commonwealth';
    
    return 'international';
  }

  /**
   * Array equality helper
   */
  arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  }

  /**
   * Select random match type
   */
  selectRandomMatchType(randomSeed) {
    const types = Object.keys(this.filterDimensions.matchType).filter(t => t !== 'all_formats');
    const selectedType = types[Math.floor(randomSeed * types.length)];
    const typeConfig = this.filterDimensions.matchType[selectedType];
    
    if (typeof typeConfig === 'object' && typeConfig.variations) {
      const variation = typeConfig.variations[Math.floor((randomSeed * 10) % typeConfig.variations.length)];
      return `${typeConfig.label} emphasizing ${variation}`;
    }
    
    return selectedType;
  }

  /**
   * Select random playing conditions
   */
  selectRandomConditions(randomSeed) {
    const conditions = Object.keys(this.filterDimensions.conditions).filter(c => c !== 'all_conditions');
    const selectedCondition = conditions[Math.floor((randomSeed * 100) % conditions.length)];
    const conditionConfig = this.filterDimensions.conditions[selectedCondition];
    
    if (typeof conditionConfig === 'object' && conditionConfig.variations) {
      const variation = conditionConfig.variations[Math.floor((randomSeed * 1000) % conditionConfig.variations.length)];
      return `${conditionConfig.label} specifically ${variation}`;
    }
    
    return selectedCondition;
  }

  /**
   * Select random tournament context
   */
  selectRandomTournament(randomSeed) {
    const tournaments = Object.keys(this.filterDimensions.tournament).filter(t => t !== 'all_tournaments');
    const selectedTournament = tournaments[Math.floor((randomSeed * 7) % tournaments.length)];
    const tournamentConfig = this.filterDimensions.tournament[selectedTournament];
    
    if (typeof tournamentConfig === 'object' && tournamentConfig.variations) {
      const variation = tournamentConfig.variations[Math.floor((randomSeed * 13) % tournamentConfig.variations.length)];
      return `${tournamentConfig.label} particularly ${variation}`;
    }
    
    return selectedTournament;
  }

  /**
   * Select random player role focus
   */
  selectRandomPlayerRole(randomSeed) {
    const roles = Object.keys(this.filterDimensions.playerRole).filter(r => r !== 'all_roles');
    const selectedRole = roles[Math.floor((randomSeed * 17) % roles.length)];
    const roleConfig = this.filterDimensions.playerRole[selectedRole];
    
    if (typeof roleConfig === 'object' && roleConfig.variations) {
      const variation = roleConfig.variations[Math.floor((randomSeed * 19) % roleConfig.variations.length)];
      return `${roleConfig.label} highlighting ${variation}`;
    }
    
    return selectedRole;
  }

  /**
   * Generate temporal variations
   */
  generateTemporalVariations(timestamp, randomSeed) {
    const strategies = this.randomizationStrategies.temporal;
    
    return {
      timeOfDay: strategies.timeOfDay[Math.floor((randomSeed * 23) % strategies.timeOfDay.length)],
      season: strategies.season[Math.floor((randomSeed * 29) % strategies.season.length)],
      context: `${strategies.dayOfWeek[Math.floor((randomSeed * 31) % strategies.dayOfWeek.length)]} ${strategies.monthContext[Math.floor((randomSeed * 37) % strategies.monthContext.length)]} atmosphere`
    };
  }

  /**
   * Generate emotional variations
   */
  generateEmotionalVariations(randomSeed) {
    const strategies = this.randomizationStrategies.emotional;
    
    return {
      intensity: strategies.intensity[Math.floor((randomSeed * 41) % strategies.intensity.length)],
      stakes: strategies.stakes[Math.floor((randomSeed * 43) % strategies.stakes.length)],
      atmosphere: strategies.atmosphere[Math.floor((randomSeed * 47) % strategies.atmosphere.length)]
    };
  }

  /**
   * Generate narrative variations
   */
  generateNarrativeVariations(category, randomSeed) {
    const strategies = this.randomizationStrategies.narrative;
    
    return {
      angle: strategies.angle[Math.floor((randomSeed * 53) % strategies.angle.length)],
      perspective: strategies.perspective[Math.floor((randomSeed * 59) % strategies.perspective.length)],
      drama: strategies.drama[Math.floor((randomSeed * 61) % strategies.drama.length)],
      categoryFocus: this.getCategoryNarrativeFocus(category, randomSeed)
    };
  }

  /**
   * Generate technical variations
   */
  generateTechnicalVariations(randomSeed) {
    const strategies = this.randomizationStrategies.technical;
    
    return {
      aspect: strategies.aspect[Math.floor((randomSeed * 67) % strategies.aspect.length)],
      innovation: strategies.innovation[Math.floor((randomSeed * 71) % strategies.innovation.length)],
      analysis: strategies.analysis[Math.floor((randomSeed * 73) % strategies.analysis.length)]
    };
  }

  /**
   * Get category-specific narrative focus
   */
  getCategoryNarrativeFocus(category, randomSeed) {
    const categoryFocus = {
      legendary_moments: ['iconic performances', 'historic firsts', 'record-breaking feats', 'dramatic finishes'],
      player_stories: ['career highlights', 'personal journeys', 'breakthrough moments', 'rivalry dynamics'],
      records_stats: ['statistical milestones', 'numerical achievements', 'data-driven insights', 'comparative analysis'],
      rules_formats: ['rule changes', 'format evolution', 'tactical innovations', 'game development'],
      cultural_impact: ['social significance', 'cultural moments', 'fan perspectives', 'media coverage']
    };
    
    const options = categoryFocus[category] || categoryFocus.legendary_moments;
    return options[Math.floor((randomSeed * 79) % options.length)];
  }

  /**
   * Convert enhanced filters to search context string
   */
  filtersToSearchContext(enhancedFilters) {
    const parts = [];
    
    // Core filters
    if (enhancedFilters.eraContext) parts.push(`Era: ${enhancedFilters.eraContext}`);
    if (enhancedFilters.countryContext) parts.push(`Region: ${enhancedFilters.countryContext}`);
    
    // New dimensions
    if (enhancedFilters.matchType) parts.push(`Format: ${enhancedFilters.matchType}`);
    if (enhancedFilters.conditions) parts.push(`Conditions: ${enhancedFilters.conditions}`);
    if (enhancedFilters.tournament) parts.push(`Competition: ${enhancedFilters.tournament}`);
    if (enhancedFilters.playerRole) parts.push(`Players: ${enhancedFilters.playerRole}`);
    
    // Randomization elements
    if (enhancedFilters.temporal) {
      parts.push(`Context: ${enhancedFilters.temporal.context} with ${enhancedFilters.temporal.season} ${enhancedFilters.temporal.timeOfDay} focus`);
    }
    
    if (enhancedFilters.emotional) {
      parts.push(`Emotional tone: ${enhancedFilters.emotional.intensity} ${enhancedFilters.emotional.stakes} moments in ${enhancedFilters.emotional.atmosphere} atmosphere`);
    }
    
    if (enhancedFilters.narrative) {
      parts.push(`Narrative: ${enhancedFilters.narrative.angle} from ${enhancedFilters.narrative.perspective} perspective with ${enhancedFilters.narrative.drama} ${enhancedFilters.narrative.categoryFocus}`);
    }
    
    if (enhancedFilters.technical) {
      parts.push(`Technical focus: ${enhancedFilters.technical.aspect} through ${enhancedFilters.technical.innovation} lens with ${enhancedFilters.technical.analysis}`);
    }
    
    // Add uniqueness marker
    parts.push(`Search seed: ${enhancedFilters.searchSeed}`);
    
    return parts.join('\n');
  }

  /**
   * Test filter generation with different seeds
   */
  testFilterGeneration(iterations = 5) {
    console.log(chalk.blue('🧪 Testing Enhanced Filter Generation...\n'));
    
    for (let i = 0; i < iterations; i++) {
      console.log(chalk.yellow(`--- Iteration ${i + 1} ---`));
      
      const baseFilters = {
        era: 'modern_era',
        countries: ['india', 'australia']
      };
      
      const enhanced = this.generateEnhancedFilters(baseFilters, 'legendary_moments');
      const searchContext = this.filtersToSearchContext(enhanced);
      
      console.log(chalk.gray(searchContext));
      console.log();
    }
  }
}

// Export singleton
let enhancedFilterInstance = null;

export const getEnhancedFilterSystem = () => {
  if (!enhancedFilterInstance) {
    enhancedFilterInstance = new EnhancedFilterSystem();
  }
  return enhancedFilterInstance;
};

export default EnhancedFilterSystem;