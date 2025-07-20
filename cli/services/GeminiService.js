/**
 * Gemini Service for CLI
 * 
 * JavaScript implementation that provides the same interface as the TypeScript GeminiService.
 */

class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  /**
   * Generate cricket trivia questions
   */
  async generateQuestions(request) {
    try {
      const prompt = this.buildPrompt(request);
      const response = await this.callGeminiAPI(prompt);
      return this.parseGeminiResponse(response, request);
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }

  /**
   * Build prompt for Gemini based on request
   */
  buildPrompt(request) {
    const count = request.count || 1;
    const categoryContext = this.getCategoryContext(request.category);
    const difficultyGuidance = this.getDifficultyGuidance(request.difficulty);
    const eraContext = this.getEraContext(request.filters?.era);
    const countryContext = this.getCountryContext(request.filters?.countries);
    const styleContext = this.getQuestionStyleContext(request.filters?.questionStyle);

    // If we have pre-fetched articles, build a context-driven prompt
    if (request.contextArticles) {
      return this.buildContextArticlesPrompt(request.contextArticles, count);
    }

    // Special handling for tutorial mode
    if (request.category === 'tutorial') {
      return this.buildTutorialPrompt(count);
    }

    return `You are a cricket trivia expert. Generate ${count} engaging cricket trivia question(s) with the following requirements:

CATEGORY: ${categoryContext}
DIFFICULTY: ${difficultyGuidance}
${eraContext}
${countryContext}
${styleContext}

QUESTION QUALITY REQUIREMENTS:
- Include contextual storytelling, not just facts
- Make questions interesting with historical anecdotes
- Avoid simple stat-based questions unless they have compelling context
- Each question should teach something memorable about cricket
- Questions should be engaging for cricket fans of various knowledge levels

FORMAT REQUIREMENTS:
Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Question text with context and story",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation with additional context and why this answer is correct"
  }
]

Generate ${count} question(s) now:`;
  }

  /**
   * Build prompt for question generation from provided articles
   */
  buildContextArticlesPrompt(articles, count) {
    const articleTexts = articles.map(
      (a, i) => `${i + 1}. TITLE: ${a.title}\nURL: ${a.link}\nSNIPPET: ${a.snippet}`
    ).join('\n\n');

    return `SYSTEM:
You are a world-class cricket trivia question writer. Using the following article snippets as reference,
generate ${count} engaging, entertaining, and informative multiple-choice trivia questions with
clear story context and factual accuracy. Adhere to best trivia practices: compelling hooks,
precise options, and concise explanations. Include the source URL for each question.

ARTICLES:
${articleTexts}

FORMAT:
Return ONLY a JSON array with ${count} elements, each object:
[{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "...",
  "source": "..."
}]

Now generate ${count} cricket trivia questions:`;
  }

  /**
   * Make HTTP request to Gemini API
   */
  async callGeminiAPI(prompt) {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse Gemini response and convert to question objects
   */
  parseGeminiResponse(response, request) {
    try {
      const content = response.candidates[0]?.content?.parts[0]?.text;
      if (!content) {
        throw new Error('No content received from Gemini');
      }

      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const rawQuestions = JSON.parse(jsonMatch[0]);
      
      return rawQuestions.map((q, index) => ({
        id: `${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        source: q.source || 'Generated from web sources',
        category: request.category || 'legendary_moments',
        difficulty: request.difficulty || 'medium',
        generatedAt: new Date(),
      }));
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  /**
   * Get category-specific context for question generation
   */
  getCategoryContext(category) {
    const contexts = {
      legendary_moments: 'Historic cricket matches, iconic performances, memorable moments that defined cricket history',
      player_stories: 'Career highlights, personal anecdotes, unique stories about cricketers past and present',
      records_stats: 'Cricket records with compelling backstories, statistical achievements with context',
      rules_formats: 'Cricket rules, game formats, evolution of the sport, equipment and playing conditions',
      cultural_impact: 'Cricket in society, movies, politics, cultural significance in different countries',
      tutorial: 'Basic cricket concepts for newcomers - game objectives, key roles, scoring, dismissals, overs, formats, famous venues, equipment, and cricket spirit'
    };
    return contexts[category] || contexts.legendary_moments;
  }

  /**
   * Get difficulty-specific guidance for question generation
   */
  getDifficultyGuidance(difficulty) {
    const guidance = {
      easy: 'Basic cricket knowledge, well-known players and events, simple rules',
      medium: 'Moderate cricket knowledge, some historical context, intermediate concepts',
      hard: 'Deep cricket knowledge, obscure historical facts, complex situations'
    };
    return guidance[difficulty] || guidance.medium;
  }

  /**
   * Get era-specific context for question generation
   */
  getEraContext(era) {
    if (!era || era === 'all_eras') {
      return '';
    }

    const eraContexts = {
      golden_age: 'TIME PERIOD: Focus on cricket from pre-1950s - Early cricket legends like W.G. Grace, the establishment of Test cricket, early tours, and foundational cricket history.',
      post_war_boom: 'TIME PERIOD: Focus on cricket from 1950s-1970s - Post-war cricket development, emergence of new Test nations, players like Bradman\'s final years, Worrell, Sobers, and the growth of international cricket.',
      world_cup_era: 'TIME PERIOD: Focus on cricket from 1970s-1990s - The ODI revolution, first World Cups, WSC, players like Kapil Dev, Imran Khan, Viv Richards, and the transformation to limited overs cricket.',
      modern_era: 'TIME PERIOD: Focus on cricket from 2000s-2010s - T20 revolution, IPL emergence, players like Tendulkar, Ponting, Dravid, technology integration, and modern cricket\'s evolution.',
      contemporary: 'TIME PERIOD: Focus on cricket from 2010s-2019 - Recent cricket history, players like Kohli, Smith, Root, AB de Villiers, modern innovations, and recent tournaments.',
      post_covid: 'TIME PERIOD: Focus on cricket from 2020-Present - Latest cricket developments, bio-bubbles, recent series, current players like Babar Azam, Bumrah, current teams and very recent events.',
      all_eras: ''
    };

    return eraContexts[era] || '';
  }

  /**
   * Get country-specific context for question generation
   */
  getCountryContext(countries) {
    if (!countries || countries.includes('all_countries') || countries.length === 0) {
      return '';
    }

    const countryNames = {
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
      all_countries: ''
    };

    const selectedCountries = countries
      .filter(c => c !== 'all_countries')
      .map(c => countryNames[c])
      .join(', ');

    if (selectedCountries) {
      return `COUNTRIES/REGIONS: Focus primarily on cricket involving ${selectedCountries}. Include players, matches, tours, and cricket culture from these regions.`;
    }

    return '';
  }

  /**
   * Get question style-specific context for question generation
   */
  getQuestionStyleContext(questionStyle) {
    if (!questionStyle || questionStyle === 'facts_opinions') {
      return '';
    }

    if (questionStyle === 'facts_only') {
      return `QUESTION STYLE: Generate ONLY factual, objective questions with verifiable answers. Avoid subjective questions about "turning points," "greatest moments," "most influential," or opinion-based assessments. Focus on concrete facts like dates, scores, records, rules, and documented events.

AVOID subjective language such as:
- "What was considered the turning point..."
- "Who is regarded as the greatest..."
- "What was the most significant moment..."
- "Which is considered the most influential..."

PREFER objective language such as:
- "Who scored the most runs in..."
- "In which year did... occur"
- "What was the final score of..."
- "Which team won the..."`;
    }

    return '';
  }

  /**
   * Build tutorial-specific prompt for cricket newcomers
   */
  buildTutorialPrompt(count) {
    const tutorialTopics = [
      'Basic Game Objective - What is cricket trying to achieve?',
      'Key Roles - Batsman, bowler, fielder basics',
      'Basic Scoring - How runs are scored',
      'Dismissals - Main ways to get out (bowled, caught, LBW)',
      'Overs & Innings - Game structure basics',
      'Formats - Test, ODI, T20 differences',
      'Famous Venues - Lord\'s, MCG, Eden Gardens',
      'World Cup Basics - Most important tournament',
      'Cricket Equipment - Bat, ball, stumps, pads',
      'Spirit of Cricket - Fair play and traditions'
    ];

    return `You are a cricket education expert creating questions for complete newcomers to cricket. Generate ${count} educational cricket questions that teach fundamental concepts.

TUTORIAL REQUIREMENTS:
- Each question should teach a basic cricket concept that newcomers need to know
- Focus on these topics in order: ${tutorialTopics.join(', ')}
- Use simple, clear language
- Avoid jargon or assume prior knowledge
- Include helpful context in explanations
- Make questions engaging but educational

QUESTION STYLE:
- Start with the most fundamental concepts first
- Build knowledge progressively
- Use real examples when possible
- Explain WHY things work the way they do
- Keep it friendly and approachable

FORMAT REQUIREMENTS:
Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Educational question about cricket basics",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Clear explanation that teaches the concept and why this answer is correct"
  }
]

Generate ${count} tutorial question(s) now:`;
  }
}

// Singleton instance
let geminiServiceInstance = null;

/**
 * Get or create GeminiService instance
 */
export const getGeminiService = () => {
  if (!geminiServiceInstance) {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY environment variable is required');
    }
    geminiServiceInstance = new GeminiService(apiKey);
  }
  return geminiServiceInstance;
};

/**
 * CLI-specific wrapper methods for common operations
 */
export class CLIGeminiService {
  constructor() {
    this.service = getGeminiService();
  }

  /**
   * Generate questions from article context (for search-generate command)
   */
  async generateQuestions(options) {
    const { contextArticles, count } = options;
    
    const request = {
      contextArticles,
      count,
      category: 'legendary_moments',
      difficulty: 'medium',
      filters: {
        era: 'all_eras',
        countries: ['all_countries'],
        questionStyle: 'facts_opinions',
        gameMode: 'fixed'
      }
    };

    return await this.service.generateQuestions(request);
  }

  /**
   * Generate questions with custom filters
   */
  async generateFilteredQuestions(filters, count = 10) {
    const request = {
      count,
      category: filters.category || 'legendary_moments',
      difficulty: filters.difficulty || 'medium',
      filters: {
        era: filters.era || 'all_eras',
        countries: filters.countries || ['all_countries'],
        questionStyle: filters.questionStyle || 'facts_opinions',
        gameMode: 'fixed'
      }
    };

    return await this.service.generateQuestions(request);
  }
}

// Export default for backward compatibility
export default { getGeminiService, CLIGeminiService };