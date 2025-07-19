/**
 * Enhanced Gemini Service for Cricket Incident Generation
 * 
 * Extends the existing Gemini service with incident-focused generation
 * optimized for web verification and fact-checking.
 */

import chalk from 'chalk';
import { config } from '../utils/config.js';

export class EnhancedGeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.baseUrl = config.gemini.baseUrl;
  }

  /**
   * Generate cricket incidents for verification
   */
  async generateIncident(options = {}) {
    try {
      const prompt = this.buildIncidentPrompt(options);
      console.log(chalk.gray('   🤖 Generating cricket incident...'));
      
      const response = await this.callGeminiAPI(prompt);
      const incident = this.parseIncidentResponse(response);
      
      console.log(chalk.gray(`   📝 Generated: "${incident.summary}"`));
      return incident;

    } catch (error) {
      console.error(chalk.red(`   ❌ Generation error: ${error.message}`));
      throw new Error(`Failed to generate incident: ${error.message}`);
    }
  }

  /**
   * Generate verifiable cricket question with incident context
   */
  async generateVerifiableQuestion(options = {}) {
    try {
      const prompt = this.buildVerifiableQuestionPrompt(options);
      console.log(chalk.gray('   🤖 Generating verifiable question...'));
      
      const response = await this.callGeminiAPI(prompt);
      const question = this.parseQuestionResponse(response);
      
      console.log(chalk.gray(`   📝 Generated question about: ${question.topic}`));
      return question;

    } catch (error) {
      console.error(chalk.red(`   ❌ Question generation error: ${error.message}`));
      throw new Error(`Failed to generate question: ${error.message}`);
    }
  }

  /**
   * Build prompt for cricket incident generation
   */
  buildIncidentPrompt(options = {}) {
    const {
      era = 'all_eras',
      country = 'all_countries',
      category = 'legendary_moments',
      difficulty = 'medium'
    } = options;

    const eraContext = this.getEraContext(era);
    const countryContext = this.getCountryContext(country);
    const categoryContext = this.getCategoryContext(category);

    return `You are a cricket historian creating factual cricket incidents for verification research. Generate a single, specific cricket incident that can be fact-checked through web searches.

REQUIREMENTS:
- Must be a REAL, verifiable cricket incident
- Include specific names, dates, venues, and scores when possible
- Focus on concrete facts rather than opinions
- Should be searchable on cricket websites like ESPNCricinfo

CONTEXT:
${eraContext}
${countryContext}
${categoryContext}

INCIDENT STRUCTURE:
Return ONLY a JSON object with this exact format:
{
  "incident": "Detailed description of the specific cricket incident with names, dates, and context",
  "summary": "Brief one-line summary of the incident",
  "searchTerms": ["key", "search", "terms", "for", "verification"],
  "facts": [
    "Specific fact 1 that can be verified",
    "Specific fact 2 that can be verified",
    "Specific fact 3 that can be verified"
  ],
  "expectedSources": ["espncricinfo.com", "other expected cricket sources"]
}

EXAMPLE OUTPUT:
{
  "incident": "During the 1983 Cricket World Cup final at Lord's, Kapil Dev took a spectacular running catch to dismiss Viv Richards when West Indies were cruising at 57/1 chasing 184. The catch was taken at deep backward square leg off the bowling of Madan Lal, and it turned the match in India's favor.",
  "summary": "Kapil Dev's catch of Viv Richards in 1983 World Cup final",
  "searchTerms": ["Kapil Dev catch Viv Richards", "1983 World Cup final", "India West Indies Lord's"],
  "facts": [
    "Match was played at Lord's cricket ground on June 25, 1983",
    "West Indies were chasing a target of 184 runs",
    "Viv Richards was caught by Kapil Dev off Madan Lal's bowling",
    "The catch was taken at deep backward square leg position"
  ],
  "expectedSources": ["espncricinfo.com", "cricbuzz.com", "wisden.com"]
}

Generate a cricket incident now:`;
  }

  /**
   * Build prompt for verifiable question generation
   */
  buildVerifiableQuestionPrompt(options = {}) {
    const {
      incident,
      difficulty = 'medium',
      questionType = 'multiple_choice'
    } = options;

    if (!incident) {
      throw new Error('Incident is required for question generation');
    }

    return `Based on the following cricket incident, create a factual trivia question that can be verified through web searches.

CRICKET INCIDENT:
${incident.incident}

REQUIREMENTS:
- Question must be about verifiable facts from this incident
- Avoid subjective opinions or interpretations
- Include specific details that can be fact-checked
- Make it engaging but factually accurate
- All options should be plausible but only one correct

DIFFICULTY: ${difficulty}
- Easy: Basic facts (who, what, when, where)
- Medium: Specific details and context
- Hard: Precise numbers, statistics, or lesser-known facts

FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "question": "Factual question about the incident",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Detailed explanation with facts that can be verified",
  "topic": "Brief topic description",
  "verificationPoints": [
    "Fact 1 that can be searched and verified",
    "Fact 2 that can be searched and verified"
  ],
  "searchHints": ["search term 1", "search term 2"]
}

Generate the question now:`;
  }

  /**
   * Get era-specific context
   */
  getEraContext(era) {
    const contexts = {
      golden_age: 'TIME PERIOD: Pre-1950s cricket history - Focus on early cricket legends, establishment of Test cricket, foundational cricket history.',
      post_war_boom: 'TIME PERIOD: 1950s-1970s - Post-war cricket development, emergence of new Test nations, players like Bradman, Worrell, Sobers.',
      world_cup_era: 'TIME PERIOD: 1970s-1990s - ODI revolution, first World Cups, WSC, players like Kapil Dev, Imran Khan, Viv Richards.',
      modern_era: 'TIME PERIOD: 2000s-2010s - T20 revolution, IPL emergence, players like Tendulkar, Ponting, Dravid.',
      contemporary: 'TIME PERIOD: 2010s-2019 - Recent cricket history, players like Kohli, Smith, Root, AB de Villiers.',
      post_covid: 'TIME PERIOD: 2020-Present - Latest cricket developments, bio-bubbles, current players.',
      all_eras: 'TIME PERIOD: Any era from cricket history'
    };
    return contexts[era] || contexts.all_eras;
  }

  /**
   * Get country-specific context
   */
  getCountryContext(country) {
    const contexts = {
      england: 'FOCUS: England cricket - Home of cricket, county cricket, English players and venues.',
      australia: 'FOCUS: Australian cricket - The Baggy Green, Sheffield Shield, Australian players and grounds.',
      india: 'FOCUS: Indian cricket - Cricket crazy nation, IPL, Indian players and domestic cricket.',
      west_indies: 'FOCUS: West Indies cricket - Caribbean cricket, dominant 1970s-80s era, calypso cricket.',
      pakistan: 'FOCUS: Pakistan cricket - Green shirts, fast bowling tradition, Pakistan players.',
      south_africa: 'FOCUS: South African cricket - Proteas, post-apartheid cricket, South African players.',
      all_countries: 'FOCUS: Global cricket involving any cricket-playing nation'
    };
    return contexts[country] || contexts.all_countries;
  }

  /**
   * Get category-specific context
   */
  getCategoryContext(category) {
    const contexts = {
      legendary_moments: 'CATEGORY: Historic cricket matches, iconic performances, memorable moments that defined cricket history.',
      player_stories: 'CATEGORY: Career highlights, personal anecdotes, unique stories about cricketers.',
      records_stats: 'CATEGORY: Cricket records with compelling backstories, statistical achievements.',
      rules_formats: 'CATEGORY: Cricket rules, game formats, evolution of the sport, equipment.',
      cultural_impact: 'CATEGORY: Cricket in society, movies, politics, cultural significance.'
    };
    return contexts[category] || contexts.legendary_moments;
  }

  /**
   * Make API call to Gemini
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
          temperature: 0.3, // Lower temperature for more factual content
          topP: 0.8,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse incident response from Gemini
   */
  parseIncidentResponse(response) {
    try {
      const content = response.candidates[0]?.content?.parts[0]?.text;
      if (!content) {
        throw new Error('No content received from Gemini');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const incident = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const required = ['incident', 'summary', 'searchTerms', 'facts'];
      const missing = required.filter(field => !incident[field]);
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      return {
        ...incident,
        generatedAt: new Date(),
        id: `incident-${Date.now()}`
      };

    } catch (error) {
      console.error(chalk.red('   ❌ Parse error:', error.message));
      throw new Error(`Failed to parse incident response: ${error.message}`);
    }
  }

  /**
   * Parse question response from Gemini
   */
  parseQuestionResponse(response) {
    try {
      const content = response.candidates[0]?.content?.parts[0]?.text;
      if (!content) {
        throw new Error('No content received from Gemini');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const question = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      const required = ['question', 'options', 'correctAnswer', 'explanation', 'topic'];
      const missing = required.filter(field => question[field] === undefined);
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      return {
        ...question,
        generatedAt: new Date(),
        id: `question-${Date.now()}`
      };

    } catch (error) {
      console.error(chalk.red('   ❌ Parse error:', error.message));
      throw new Error(`Failed to parse question response: ${error.message}`);
    }
  }
}