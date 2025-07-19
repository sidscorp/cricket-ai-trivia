/**
 * Grounded Gemini Service with Web Search
 * 
 * Uses Gemini's native web search grounding (Oct 2024 release) to generate
 * and verify cricket incidents in real-time, eliminating the need for 
 * separate Google Custom Search API.
 */

import chalk from 'chalk';
import { config } from '../utils/config.js';

export class GroundedGeminiService {
  constructor() {
    this.apiKey = config.gemini.apiKey;
    this.baseUrl = config.gemini.baseUrl;
  }

  /**
   * Generate cricket incident with web search verification
   */
  async generateVerifiedIncident(options = {}) {
    try {
      const prompt = this.buildVerifiedIncidentPrompt(options);
      console.log(chalk.gray('   🌐 Generating cricket incident with web verification...'));
      
      const response = await this.callGeminiWithSearch(prompt);
      const incident = this.parseGroundedResponse(response, 'incident');
      
      console.log(chalk.gray(`   ✅ Verified incident: "${incident.summary}"`));
      return incident;

    } catch (error) {
      console.error(chalk.red(`   ❌ Grounded generation error: ${error.message}`));
      throw new Error(`Failed to generate verified incident: ${error.message}`);
    }
  }

  /**
   * Generate cricket question with web-verified facts
   */
  async generateVerifiedQuestion(options = {}) {
    try {
      const prompt = this.buildVerifiedQuestionPrompt(options);
      console.log(chalk.gray('   🌐 Generating cricket question with web verification...'));
      
      const response = await this.callGeminiWithSearch(prompt);
      const question = this.parseGroundedResponse(response, 'question');
      
      console.log(chalk.gray(`   ✅ Verified question: ${question.topic}`));
      return question;

    } catch (error) {
      console.error(chalk.red(`   ❌ Grounded question error: ${error.message}`));
      throw new Error(`Failed to generate verified question: ${error.message}`);
    }
  }

  /**
   * Build prompt for web-verified cricket incident generation
   */
  buildVerifiedIncidentPrompt(options = {}) {
    const {
      era = 'all_eras',
      country = 'all_countries',
      category = 'legendary_moments',
      difficulty = 'medium'
    } = options;

    const eraContext = this.getEraContext(era);
    const countryContext = this.getCountryContext(country);
    const categoryContext = this.getCategoryContext(category);

    return `You are a master cricket storyteller with web search access. Find and craft compelling, dramatic cricket incidents that captivate readers while being completely factually accurate through web verification.

SEARCH AND STORY REQUIREMENTS:
- Search for cricket's most dramatic moments, unlikely heroes, and fascinating incidents
- Look for stories with tension, emotion, pressure, and human drama
- Verify every detail through authoritative cricket sources (ESPNCricinfo, Wisden, etc.)
- Focus on moments that changed careers, defined legends, or defied all odds

CONTEXT:
${eraContext}
${countryContext}
${categoryContext}

STORYTELLING ELEMENTS TO INCLUDE:
🎭 DRAMA: Pressure situations, last-over thrillers, comeback victories
🏏 CONTEXT: Match situations, what was at stake, crowd atmosphere
💪 HUMAN STORY: Player backgrounds, career-defining moments, emotional stakes
📊 VERIFIED DETAILS: Specific scores, statistics, and match circumstances
🌟 SURPRISE FACTOR: Unexpected heroes, stunning reversals, record-breaking feats

SEARCH STRATEGY:
- Search for "greatest cricket comebacks", "most dramatic cricket moments"
- Look for specific match reports with detailed narratives
- Find player interviews and background stories
- Verify through multiple authoritative cricket sources

OUTPUT FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "incident": "Compelling, narrative-rich description that sets the scene, builds tension, and tells the complete story with verified details",
  "summary": "Dramatic one-line summary that captures the essence",
  "verifiedFacts": [
    "Specific fact 1 confirmed by web search",
    "Specific fact 2 confirmed by web search", 
    "Specific fact 3 confirmed by web search"
  ],
  "storyElements": [
    "Key dramatic element 1 (pressure/stakes)",
    "Key dramatic element 2 (turning point)",
    "Key dramatic element 3 (impact/legacy)"
  ],
  "sources": [
    "Primary source URL or reference",
    "Secondary source URL or reference"
  ],
  "searchTerms": ["key", "search", "terms", "used"],
  "confidence": "high|medium|low based on source quality and verification"
}

EXAMPLE EXCELLENT INCIDENT:
"The rain had stopped, but the tension at Lord's was suffocating. It was July 25, 2019, and the Cricket World Cup final was heading into a Super Over - the first in World Cup history. England and New Zealand were tied after 50 overs each. Ben Stokes had just played one of the greatest innings under pressure, but now it came down to six balls that would define a generation. The 84,000 fans were on their feet, millions watching worldwide knew they were witnessing history..."

Now search for a compelling cricket story and create a dramatic, verified incident:`;
  }

  /**
   * Build prompt for web-verified cricket question generation
   */
  buildVerifiedQuestionPrompt(options = {}) {
    const {
      era = 'all_eras',
      country = 'all_countries',
      difficulty = 'medium',
      topic
    } = options;

    let searchFocus = '';
    if (topic) {
      searchFocus = `SPECIFIC TOPIC: Focus on ${topic}`;
    } else {
      const eraContext = this.getEraContext(era);
      const countryContext = this.getCountryContext(country);
      searchFocus = `${eraContext}\n${countryContext}`;
    }

    return `You are a master cricket storyteller with web search access. Create captivating, narrative-driven cricket trivia questions that tell a story while being factually accurate through web verification.

SEARCH AND STORY PROCESS:
1. Search for dramatic cricket moments, unlikely heroes, memorable incidents, or fascinating statistics
2. Verify all details through authoritative cricket sources (ESPNCricinfo, Wisden, etc.)
3. Craft an engaging question that sets the scene and builds intrigue
4. Include rich context, background story, and compelling details

${searchFocus}

QUESTION QUALITY REQUIREMENTS:
🎭 STORYTELLING: Paint a vivid picture with context and drama
🏏 CRICKET DEPTH: Include specific match situations, conditions, or pressure moments
📊 VERIFIED FACTS: All details must be confirmed through web search
🎯 ENGAGEMENT: Make cricket fans think "I remember that!" or "I never knew that!"
💫 SURPRISE FACTOR: Include unexpected twists or lesser-known aspects of famous events

DIFFICULTY: ${difficulty}
- Easy: Famous moments with engaging backstory
- Medium: Compelling situations requiring cricket knowledge
- Hard: Intricate scenarios with surprising details

QUESTION STYLE EXAMPLES:

EXCELLENT STORYTELLING QUESTION:
"The tension was palpable at Eden Gardens in 2001. Australia needed just 173 runs to win with all 10 wickets in hand, seemingly cruising toward victory. But then VVS Laxman and Rahul Dravid began one of cricket's greatest partnerships. Their marathon stand turned the match on its head in one of Test cricket's most stunning comebacks. How many runs did Laxman and Dravid add for the 5th wicket in this legendary partnership?"

BAD BASIC QUESTION:
"Who scored the most runs in the 2001 Kolkata Test match?"

EXCELLENT CONTEXT-RICH QUESTION:
"It was the final over of the 2007 T20 World Cup final. Pakistan needed 13 runs with Misbah-ul-Haq on strike. The crowd was electric, millions watching worldwide. Misbah had been Pakistan's rock throughout the tournament. Then came the famous scoop shot attempt that would define careers and break hearts. Who was the bowler who caught Misbah's scoop to seal India's victory?"

VERIFICATION REQUIREMENTS:
- All narrative details must be factually accurate
- Verify match situations, scores, and outcomes
- Confirm player performances and specific statistics
- Cross-reference story elements across multiple cricket sources

OUTPUT FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "question": "Engaging, story-driven question with rich context and verified details",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Compelling explanation that continues the story and provides additional fascinating context",
  "topic": "Descriptive topic that captures the drama",
  "verifiedSources": [
    "Source 1 that confirms the story details",
    "Source 2 that confirms the answer"
  ],
  "searchQueries": ["query 1 used", "query 2 used"],
  "confidence": "high|medium|low based on verification quality",
  "storyElements": [
    "Key dramatic element 1",
    "Key dramatic element 2",
    "Key dramatic element 3"
  ]
}

Search for a compelling cricket story and create an engaging, verified trivia question:`;
  }

  /**
   * Get era-specific context (same as before)
   */
  getEraContext(era) {
    const contexts = {
      golden_age: 'TIME PERIOD: Pre-1950s cricket history - Focus on early cricket legends, establishment of Test cricket.',
      post_war_boom: 'TIME PERIOD: 1950s-1970s - Post-war cricket development, players like Bradman, Worrell, Sobers.',
      world_cup_era: 'TIME PERIOD: 1970s-1990s - ODI revolution, first World Cups, players like Kapil Dev, Imran Khan, Viv Richards.',
      modern_era: 'TIME PERIOD: 2000s-2010s - T20 revolution, IPL emergence, players like Tendulkar, Ponting, Dravid.',
      contemporary: 'TIME PERIOD: 2010s-2019 - Recent cricket history, players like Kohli, Smith, Root.',
      post_covid: 'TIME PERIOD: 2020-Present - Latest cricket developments, current players.',
      all_eras: 'TIME PERIOD: Any era from cricket history'
    };
    return contexts[era] || contexts.all_eras;
  }

  /**
   * Get country-specific context (same as before)
   */
  getCountryContext(country) {
    const contexts = {
      england: 'FOCUS: England cricket - Home of cricket, county cricket, English players.',
      australia: 'FOCUS: Australian cricket - The Baggy Green, Australian players and grounds.',
      india: 'FOCUS: Indian cricket - IPL, Indian players and domestic cricket.',
      west_indies: 'FOCUS: West Indies cricket - Caribbean cricket, dominant 1970s-80s era.',
      pakistan: 'FOCUS: Pakistan cricket - Fast bowling tradition, Pakistan players.',
      south_africa: 'FOCUS: South African cricket - Proteas, South African players.',
      all_countries: 'FOCUS: Global cricket involving any cricket-playing nation'
    };
    return contexts[country] || contexts.all_countries;
  }

  /**
   * Get category-specific context (same as before)
   */
  getCategoryContext(category) {
    const contexts = {
      legendary_moments: 'CATEGORY: Historic cricket matches, iconic performances, memorable moments.',
      player_stories: 'CATEGORY: Career highlights, personal anecdotes, unique stories about cricketers.',
      records_stats: 'CATEGORY: Cricket records with compelling backstories, statistical achievements.',
      rules_formats: 'CATEGORY: Cricket rules, game formats, evolution of the sport.',
      cultural_impact: 'CATEGORY: Cricket in society, movies, politics, cultural significance.'
    };
    return contexts[category] || contexts.legendary_moments;
  }

  /**
   * Make API call to Gemini with Google Search grounding
   */
  async callGeminiWithSearch(prompt) {
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      tools: [{
        google_search_retrieval: {}
      }],
      generationConfig: {
        temperature: 0.2, // Even lower for speed while maintaining quality
        topP: 0.7,
        maxOutputTokens: 1024, // Reduced for faster generation
      },
    };

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Parse grounded response with search metadata
   */
  parseGroundedResponse(response, type) {
    try {
      const candidate = response.candidates[0];
      if (!candidate) {
        throw new Error('No candidate received from Gemini');
      }

      const content = candidate.content?.parts[0]?.text;
      if (!content) {
        throw new Error('No content received from Gemini');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Extract grounding metadata if available
      const groundingMetadata = candidate.groundingMetadata || {};
      const searchQueries = groundingMetadata.webSearchQueries || [];
      const groundingChunks = groundingMetadata.groundingChunks || [];
      const groundingSupports = groundingMetadata.groundingSupports || [];

      // Validate required fields based on type
      const requiredFields = type === 'incident' 
        ? ['incident', 'summary', 'verifiedFacts']
        : ['question', 'options', 'correctAnswer', 'explanation', 'topic'];
      
      const missing = requiredFields.filter(field => parsedData[field] === undefined);
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      return {
        ...parsedData,
        generatedAt: new Date(),
        id: `${type}-${Date.now()}`,
        grounding: {
          searchQueries: searchQueries,
          groundingChunks: groundingChunks,
          groundingSupports: groundingSupports,
          hasGrounding: searchQueries.length > 0 || groundingChunks.length > 0,
          webResults: groundingChunks.length // For backward compatibility
        }
      };

    } catch (error) {
      console.error(chalk.red(`   ❌ Parse error: ${error.message}`));
      throw new Error(`Failed to parse grounded response: ${error.message}`);
    }
  }

  /**
   * Get search quality assessment
   */
  getSearchQuality(groundingData) {
    if (!groundingData.hasGrounding) {
      return { quality: 'none', message: 'No web search performed' };
    }

    const queryCount = groundingData.searchQueries.length;
    const resultCount = groundingData.groundingChunks.length;

    if (queryCount >= 2 && resultCount >= 3) {
      return { quality: 'high', message: `${queryCount} searches, ${resultCount} web sources` };
    } else if (queryCount >= 1 && resultCount >= 1) {
      return { quality: 'medium', message: `${queryCount} searches, ${resultCount} web sources` };
    } else {
      return { quality: 'low', message: 'Limited web verification' };
    }
  }
}