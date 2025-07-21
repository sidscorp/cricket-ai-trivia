/**
 * Gemini AI Service
 * 
 * Handles integration with Google's Gemini API for generating
 * contextual cricket trivia questions with explanations.
 */

import { TriviaQuestion, QuestionGenerationRequest, QuestionCategory, DifficultyLevel, CricketEra, CricketCountry, QuestionStyle } from '../types/Question';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Build prompt for question generation from provided articles
   */
  private buildContextArticlesPrompt(
    articles: { title: string; snippet: string; link: string }[],
    count: number
  ): string {
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
   * Generate cricket trivia questions using Gemini AI
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<TriviaQuestion[]> {
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
   * Build contextual prompt for Gemini based on trivia research principles
   */
  private buildPrompt(request: QuestionGenerationRequest): string {
    const categoryContext = this.getCategoryContext(request.category);
    const difficultyGuidance = this.getDifficultyGuidance(request.difficulty);
    const count = request.count || 1;
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

EXAMPLE GOOD QUESTION:
{
  "question": "During the 1983 World Cup final, Kapil Dev made a crucial catch that many consider the turning point. Who was the batsman he caught, and what made this catch so significant?",
  "options": ["Viv Richards - it broke West Indies' momentum", "Gordon Greenidge - it ended a dangerous partnership", "Clive Lloyd - it removed the captain", "Joel Garner - it ended the innings"],
  "correctAnswer": 0,
  "explanation": "Kapil Dev caught Viv Richards at backward square leg when Richards was batting aggressively and seemed to be taking the game away from India. This catch is often cited as the moment that changed the course of the match and ultimately led to India's historic World Cup victory."
}

Generate ${count} question(s) now:`;
  }

  /**
   * Get category-specific context for question generation
   */
  private getCategoryContext(category: QuestionCategory): string {
    const contexts = {
      legendary_moments: 'Historic cricket matches, iconic performances, memorable moments that defined cricket history',
      player_stories: 'Career highlights, personal anecdotes, unique stories about cricketers past and present',
      records_stats: 'Cricket records with compelling backstories, statistical achievements with context',
      rules_formats: 'Cricket rules, game formats, evolution of the sport, equipment and playing conditions',
      cultural_impact: 'Cricket in society, movies, politics, cultural significance in different countries',
      tutorial: 'Basic cricket concepts for newcomers - game objectives, key roles, scoring, dismissals, overs, formats, famous venues, equipment, and cricket spirit'
    };
    return contexts[category];
  }

  /**
   * Get difficulty-specific guidance for question generation
   */
  private getDifficultyGuidance(difficulty: DifficultyLevel): string {
    const guidance = {
      easy: 'Basic cricket knowledge, well-known players and events, simple rules',
      medium: 'Moderate cricket knowledge, some historical context, intermediate concepts',
      hard: 'Deep cricket knowledge, obscure historical facts, complex situations'
    };
    return guidance[difficulty];
  }

  /**
   * Build tutorial-specific prompt for cricket newcomers
   */
  private buildTutorialPrompt(count: number): string {
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

EXAMPLE TUTORIAL QUESTION:
{
  "question": "What is the main objective for the batting team in cricket?",
  "options": ["To hit the ball as hard as possible", "To score more runs than the opposing team", "To prevent the other team from bowling", "To hit the ball out of the ground"],
  "correctAnswer": 1,
  "explanation": "The batting team's main goal is to score more runs than the opposing team. While hitting the ball hard can help score runs, the key is accumulating more points (runs) than your opponents will score when they bat."
}

Generate ${count} tutorial question(s) now:`;
  }

  /**
   * Get era-specific context for question generation
   */
  private getEraContext(era?: CricketEra): string {
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

    return eraContexts[era];
  }

  /**
   * Get country-specific context for question generation
   */
  private getCountryContext(countries?: CricketCountry[]): string {
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
  private getQuestionStyleContext(questionStyle?: QuestionStyle): string {
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
   * Make HTTP request to Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<GeminiResponse> {
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
   * Parse Gemini response and convert to TriviaQuestion objects
   */
  private parseGeminiResponse(response: GeminiResponse, request: QuestionGenerationRequest): TriviaQuestion[] {
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
      
      return rawQuestions.map((q: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        category: request.category,
        difficulty: request.difficulty,
        generatedAt: new Date(),
      }));
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
let geminiService: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiService) {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('API Key length:', apiKey ? apiKey.length : 'undefined');
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_GEMINI_API_KEY environment variable is required');
    }
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
};
