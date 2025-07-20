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
      
      // Generate dynamic configuration based on difficulty and category for variety
      const dynamicConfig = this.getDynamicConfigForRequest(request);
      
      const response = await this.callGeminiAPI(prompt, dynamicConfig);
      const questions = this.parseGeminiResponse(response, request);
      
      // Add validation layer for article-based questions
      if (request.contextArticles && questions.length > 0) {
        const validatedQuestions = await this.validateQuestionsAgainstArticles(questions, request.contextArticles);
        return validatedQuestions;
      }
      
      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }

  /**
   * Generate dynamic configuration tailored to request parameters
   */
  getDynamicConfigForRequest(request) {
    const difficulty = request.difficulty || 'medium';
    const category = request.category || 'legendary_moments';
    
    // Base configuration profiles with random variation
    const baseConfigs = {
      easy: { temp: 0.6, topP: 0.7 },      // More focused for clarity
      medium: { temp: 0.7, topP: 0.8 },    // Balanced approach
      hard: { temp: 0.8, topP: 0.9 }       // More creative for complex stories
    };
    
    // Category-specific adjustments for storytelling variety
    const categoryAdjustments = {
      legendary_moments: { tempBoost: 0.05, topPBoost: 0.05 }, // Extra drama
      player_stories: { tempBoost: 0.02, topPBoost: 0.03 },    // Personal narrative
      records_stats: { tempBoost: -0.02, topPBoost: -0.02 },   // More focused
      rules_formats: { tempBoost: -0.03, topPBoost: -0.03 },   // Precision needed
      cultural_impact: { tempBoost: 0.03, topPBoost: 0.04 }    // Creative context
    };
    
    const baseConfig = baseConfigs[difficulty] || baseConfigs.medium;
    const adjustment = categoryAdjustments[category] || { tempBoost: 0, topPBoost: 0 };
    
    // Add random variation for further diversity
    const randomVariation = (Math.random() - 0.5) * 0.1; // ±0.05 variation
    
    return {
      temperature: Math.max(0.1, Math.min(0.95, 
        baseConfig.temp + adjustment.tempBoost + randomVariation)),
      topP: Math.max(0.1, Math.min(0.95, 
        baseConfig.topP + adjustment.topPBoost + (randomVariation * 0.5))),
      maxOutputTokens: 2048,
    };
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

    return `SYSTEM:
You are a master cricket storyteller and legendary trivia creator. Your expertise transforms cricket history into irresistible trivia that captivates cricket fans worldwide. Create ${count} EPIC cricket questions that tell unforgettable stories.

🏏 TARGET CATEGORY: ${categoryContext}
📈 DIFFICULTY LEVEL: ${difficultyGuidance}
${eraContext}
${countryContext}
${styleContext}

🎯 LEGENDARY TRIVIA REQUIREMENTS:
✅ FOCUS ON: Game-changing moments, legendary performances, dramatic victories, iconic rivalries, career-defining innings, record-breaking feats, emotional breakthroughs, controversial incidents, turning points that shaped cricket history

✅ STORYTELLING ELEMENTS:
- Set dramatic scene with tension and stakes
- Include emotional context and human stories
- Explain WHY the moment became legendary
- Connect to cricket culture and fan memories
- Use vivid language that brings history to life

❌ ABSOLUTELY AVOID: Administrative facts (board positions, committee memberships), dry birth dates, simple debut years, generic statistics without drama, procedural information, boring award categories

🎪 ENGAGEMENT MAGIC:
- Start with compelling setup that hooks readers
- Build tension before revealing the key question
- Include stakes that matter to cricket fans
- Make fans think "I MUST know this story!"
- Test knowledge of moments fans actually discuss

📖 STORY STRUCTURE FORMULA:
1. DRAMA SETUP: "In the heat of [intense situation]..."
2. STAKES: "With [important outcome] on the line..."
3. PIVOTAL MOMENT: "Which [player/team/decision] [dramatic action]?"
4. IMPACT: Explanation of why this became cricket legend

EPIC EXAMPLES:

LEGENDARY: "In the dying moments of the 2019 World Cup final at Lord's, with scores tied and England needing a boundary to win, which freak incident involving the ball hitting a diving Ben Stokes' bat gifted England the crucial extra runs that changed cricket history?"

BORING: "In which year was the ICC formed?"

LEGENDARY: "During the infamous 'Sandpaper Gate' scandal that rocked Australian cricket, which tearful captain's press conference apology became one of the most watched moments in cricket history, ending his leadership career?"

BORING: "Who was the ICC Chairman in 2018?"

FORMAT REQUIREMENTS:
Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Dramatic setup + story-driven question that tests cricket legends knowledge",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Rich storytelling explanation of why this moment became cricket legend and additional fascinating context"
  }
]

Generate ${count} LEGENDARY cricket trivia question(s) now:`;
  }

  /**
   * Build prompt for question generation from provided articles
   */
  buildContextArticlesPrompt(articles, count) {
    const articleTexts = articles.map(
      (a, i) => `${i + 1}. TITLE: ${a.title}\nURL: ${a.link}\nSNIPPET: ${a.snippet}`
    ).join('\n\n');

    return `SYSTEM:
You are a cricket fact extraction and trivia creation expert. Your mission is to identify concrete, verifiable cricket events from articles and transform them into engaging factual trivia questions.

🎯 FACTUAL CONTENT EXTRACTION:
✅ EXTRACT CONCRETE FACTS: Match results, player performances, specific scores, dates, venues, records broken, decisions made, incidents that occurred
✅ FOCUS ON ACTUAL EVENTS: What actually happened in specific matches, series, tournaments, or situations described in the articles
✅ VERIFIABLE INFORMATION: Facts that can be checked against cricket records, scorecards, and historical documentation

❌ ABSOLUTELY AVOID: Article opinions, subjective assessments, what the article "says" or "suggests", editorial commentary, speculative content, administrative trivia

📊 FACTUAL QUESTION FRAMEWORK:
1. **FACT IDENTIFICATION**: Extract specific cricket facts (scores, names, venues, dates, results)
2. **EVENT CONTEXTUALIZATION**: Set up the cricket situation where this fact occurred
3. **QUESTION FORMATION**: Ask about the specific factual detail, not opinions or interpretations
4. **ANSWER VERIFICATION**: Ensure the correct answer is a concrete fact from the article

⚠️ CRITICAL REQUIREMENTS:
- Questions MUST test knowledge of actual cricket events, not article content
- Focus on "What happened?" not "What does the article say happened?"
- Extract concrete cricket facts: WHO did WHAT, WHEN, WHERE, WHAT was the RESULT
- Avoid subjective language like "most important," "greatest," "turning point" unless it's a factual designation
- Questions should be answerable by someone who knows cricket history, regardless of having read the article

🏏 FACTUAL QUESTION PATTERNS:

GOOD: "In the 2019 World Cup final at Lord's, England's match-tying score led to a Super Over. What unusual rule decided the winner when the Super Over was also tied?"
(Tests knowledge of actual event and rule)

BAD: "According to the article, what was considered the most significant moment in the match?"
(Tests article comprehension, not cricket knowledge)

GOOD: "Which bowler took 6 wickets for 23 runs against Australia at Melbourne in 2020, achieving the best bowling figures for India in that series?"
(Tests specific performance fact)

BAD: "What performance did the article describe as 'legendary'?"
(Tests article opinion, not cricket fact)

ARTICLES FOR FACT EXTRACTION:
${articleTexts}

FACT EXTRACTION PROCESS:
1. Read each article and identify concrete cricket events and facts
2. For each fact, create context around the cricket situation
3. Form questions that test knowledge of the actual event
4. Ensure answers are verifiable cricket facts, not article interpretations

SOURCE CITATION:
- Use exact article URL that contained the fact
- Questions test cricket knowledge, sourced from article information

EXAMPLES OF PROPER FACTUAL QUESTIONS:

EXCELLENT: "In the 2005 Ashes series at Edgbaston, England scored 407 in their first innings. Which Australian fast bowler took 5 wickets in that innings, including the crucial dismissal of Kevin Pietersen?"
(Tests specific bowling performance fact)

EXCELLENT: "During the 1983 World Cup final, Kapil Dev took a running catch to dismiss Viv Richards. At what score was Richards dismissed, effectively ending West Indies' chase?"
(Tests specific match situation and score)

AVOID: "What did ESPNCricinfo describe as the most memorable aspect of the match?"
(Tests article content, not cricket facts)

FORMAT REQUIREMENTS:
Return ONLY a JSON array with ${count} elements:
[{
  "question": "Contextual setup + factual cricket question about specific event/performance/result",
  "options": ["Specific cricket fact A", "Specific cricket fact B", "Specific cricket fact C", "Specific cricket fact D"],
  "correctAnswer": 0,
  "explanation": "Factual explanation of the cricket event and its significance in cricket history",
  "source": "https://exact-article-url-here"
}]

Extract ${count} factual cricket events and create trivia questions:`;
  }

  /**
   * Validate generated questions against source articles for accuracy and grounding
   */
  async validateQuestionsAgainstArticles(questions, articles) {
    try {
      const articleTexts = articles.map(
        (a, i) => `${i + 1}. TITLE: ${a.title}\nURL: ${a.link}\nSNIPPET: ${a.snippet}`
      ).join('\n\n');

      const questionsText = questions.map(
        (q, i) => `${i + 1}. QUESTION: ${q.question}\nOPTIONS: ${q.options.join(', ')}\nANSWER: ${q.options[q.correctAnswer]}\nSOURCE: ${q.source}`
      ).join('\n\n');

      const validationPrompt = `FACTUAL VALIDATION TASK:
You are a cricket fact validation expert. Review each trivia question to ensure it tests factual cricket knowledge rather than article comprehension, and that facts are accurately extracted.

ARTICLES:
${articleTexts}

QUESTIONS TO VALIDATE:
${questionsText}

VALIDATION CRITERIA:
✅ ACCEPT if: 
- Question tests knowledge of specific cricket facts/events from articles
- Answer is a verifiable cricket fact (score, name, date, result, performance)
- Question focuses on "what happened" not "what article says"
- Facts are accurately extracted from article content

❌ REJECT if:
- Question tests article comprehension rather than cricket knowledge
- Contains subjective language ("most important", "greatest", "according to article")
- Answer cannot be verified as factual cricket information
- Question is about article opinions rather than cricket events
- Facts are inaccurate or misrepresented

QUALITY RANKING (for accepted questions):
A = Excellent factual question with clear cricket event/performance
B = Good factual question with minor issues
C = Acceptable but could be more specific

For each question, respond with:
ACCEPT-A, ACCEPT-B, ACCEPT-C, or REJECT

Example:
1. ACCEPT-A
2. REJECT
3. ACCEPT-B

Validate and rank each question now:`;

      const validationResponse = await this.callGeminiAPI(validationPrompt, {
        temperature: 0.2, // Low temperature for consistent validation
        topP: 0.7,
        maxOutputTokens: 512,
      });

      const validationResult = validationResponse.candidates[0]?.content?.parts[0]?.text || '';
      const validationLines = validationResult.split('\n').filter(line => line.trim());
      
      // Filter and rank questions based on validation results
      const rankedQuestions = questions.map((question, index) => {
        const validationLine = validationLines[index] || '';
        const isAccepted = validationLine.toLowerCase().includes('accept');
        
        let quality = 'C';
        if (validationLine.includes('ACCEPT-A')) quality = 'A';
        else if (validationLine.includes('ACCEPT-B')) quality = 'B';
        else if (validationLine.includes('ACCEPT-C')) quality = 'C';
        
        if (!isAccepted) {
          console.log(`🚫 Question ${index + 1} rejected: ${question.question.substring(0, 80)}...`);
          return null;
        }
        
        return { ...question, quality };
      }).filter(q => q !== null);

      // Sort by quality (A > B > C) for better selection
      rankedQuestions.sort((a, b) => {
        const qualityOrder = { 'A': 3, 'B': 2, 'C': 1 };
        return qualityOrder[b.quality] - qualityOrder[a.quality];
      });

      console.log(`✅ Validated ${rankedQuestions.length}/${questions.length} questions (A:${rankedQuestions.filter(q => q.quality === 'A').length}, B:${rankedQuestions.filter(q => q.quality === 'B').length}, C:${rankedQuestions.filter(q => q.quality === 'C').length})`);
      
      return rankedQuestions;
    } catch (error) {
      console.error('Question validation failed:', error);
      // Return original questions if validation fails
      return questions;
    }
  }

  /**
   * Generate dynamic configuration parameters for varied question generation
   */
  getDynamicGenerationConfig() {
    // Array of different configuration profiles for variety
    const configProfiles = [
      // Standard storytelling profile
      { temperature: 0.7, topP: 0.8, name: 'balanced' },
      
      // Creative storytelling profile  
      { temperature: 0.8, topP: 0.9, name: 'creative' },
      
      // Focused narrative profile
      { temperature: 0.6, topP: 0.7, name: 'focused' },
      
      // Dynamic storytelling profile
      { temperature: 0.75, topP: 0.85, name: 'dynamic' },
      
      // Engaging narrative profile
      { temperature: 0.72, topP: 0.82, name: 'engaging' }
    ];
    
    // Randomly select a configuration profile
    const profile = configProfiles[Math.floor(Math.random() * configProfiles.length)];
    
    return {
      temperature: profile.temperature,
      topP: profile.topP,
      maxOutputTokens: 2048,
    };
  }

  /**
   * Make HTTP request to Gemini API with dynamic configuration
   */
  async callGeminiAPI(prompt, generationConfig = null) {
    // Dynamic generation config based on request parameters
    const config = generationConfig || this.getDynamicGenerationConfig();
    
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: config,
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
      legendary_moments: `🏆 LEGENDARY CRICKET MOMENTS - Focus on game-changing, spine-tingling moments that define cricket folklore:
        • Match-winning performances under extreme pressure (last-ball finishes, impossible chases)
        • Iconic rivalries and their defining battles (Ashes classics, Indo-Pak thrillers)
        • Career-defining moments that elevated players to legendary status
        • Controversial incidents that sparked debates and changed cricket
        • Emotional breakthroughs (first wins, comeback stories, underdog triumphs)
        • Record-breaking feats that left crowds speechless
        FOCUS: Moments cricket fans debate, remember, and retell with passion`,
        
      player_stories: `👤 COMPELLING PLAYER NARRATIVES - Focus on human stories that resonate with cricket fans:
        • Rise from adversity tales (poverty to stardom, injury comebacks)
        • Personality-driven stories (unique characters, memorable quotes, quirks)
        • Rivalry dynamics and personal battles on field
        • Career-changing decisions and their dramatic consequences
        • Behind-the-scenes drama and locker room legends
        • Cultural impact and fan connections beyond cricket
        FOCUS: Stories that make players legendary beyond just their statistics`,
        
      records_stats: `📊 RECORD-BREAKING DRAMA - Focus on statistical achievements with compelling narratives:
        • Records broken in dramatic fashion or extraordinary circumstances
        • Statistical milestones that changed cricket history or perception
        • Unexpected record holders and their surprising achievements
        • Records that involved controversy, pressure, or emotional stakes
        • Comparative achievements that sparked debates about greatness
        • Statistical oddities and cricket's most fascinating numbers
        FOCUS: Numbers that tell dramatic stories, not just dry statistics`,
        
      rules_formats: `⚖️ GAME-CHANGING RULES & EVOLUTION - Focus on cricket's dramatic transformations:
        • Rule changes that revolutionized cricket (DRS, powerplays, T20 innovations)
        • Format evolution stories (how T20 changed cricket culture)
        • Controversial law interpretations that decided matches
        • Equipment innovations that changed the game
        • Umpiring decisions that sparked rule changes
        • Playing condition adaptations in different eras/countries
        FOCUS: How cricket's evolution created memorable moments and debates`,
        
      cultural_impact: `🌍 CRICKET'S CULTURAL RESONANCE - Focus on cricket's deeper significance:
        • Cricket's role in major cultural/political moments
        • Matches that transcended sport (unity, diplomacy, social change)
        • Cricket's influence on art, literature, movies, and popular culture
        • Regional cricket traditions and their unique characteristics
        • Cricket as a reflection of societal changes and values
        • Fan culture phenomena and their lasting impact
        FOCUS: When cricket became more than just a game`,
        
      tutorial: `🎓 CRICKET FUNDAMENTALS WITH ENGAGING CONTEXT - Make basics memorable:
        • Core concepts explained through famous examples and memorable moments
        • Rules illustrated with exciting match situations
        • Equipment and format explanations with historical context
        • Basic strategies demonstrated through legendary tactical decisions
        • Cricket spirit and traditions explained through inspiring stories
        • Venue significance and cricket geography with cultural stories
        FOCUS: Teaching cricket through engaging stories rather than dry facts`
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