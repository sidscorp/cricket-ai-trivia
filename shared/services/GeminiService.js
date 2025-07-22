/**
 * Unified Gemini Service for Cricket Trivia
 * 
 * Single implementation for both CLI and UI environments
 * Handles integration with Google's Gemini API for generating
 * contextual cricket trivia questions with explanations.
 */

import { AI_MODELS } from '../config/ai-models.js';
import { isCliEnvironment } from '../config/constants.js';

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
      
      // Generate dynamic configuration based on difficulty and category
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
      maxOutputTokens: 4096,
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
You are a master cricket storyteller specializing in dramatic, factual incidents. Transform concrete cricket events from articles into gripping, narrative-driven trivia that captures the drama and emotion of what actually happened.

🎯 DRAMATIC INCIDENT EXTRACTION:
✅ IDENTIFY HIGH-DRAMA EVENTS: Last-ball finishes, controversial decisions, record-breaking performances, shocking upsets, weather interruptions, debut heroics, farewell moments
✅ EXTRACT SPECIFIC DRAMA: The exact moment of tension, the key player action, the decisive factor, the unexpected twist
✅ FACTUAL BUT THRILLING: Real incidents with maximum story potential - nail-biting, shocking, historic, emotional

❌ AVOID BORING FACTS: Generic statistics, administrative details, routine performances, obvious outcomes

🎪 DRAMATIC STORYTELLING FRAMEWORK:
1. **INCIDENT DISCOVERY**: Find the most dramatic, specific event in each article
2. **TENSION BUILDING**: Set up the high-stakes situation and context
3. **DRAMATIC QUESTION**: Focus on the pivotal moment, decision, or twist
4. **EMOTIONAL IMPACT**: Capture why this moment was shocking/thrilling/historic

FORMAT - CRITICAL:
Return ONLY valid JSON. No markdown, comments, or extra text. Keep all strings SHORT and on single lines.
Use brief, concise language. Limit question text to 150 characters max.
Limit explanation text to 100 characters max.

ARTICLES FOR FACT EXTRACTION:
${articleTexts}

Return JSON array with ${count} elements:
[{"question":"Dramatic setup + factual cricket question","options":["A","B","C","D"],"correctAnswer":0,"explanation":"Brief explanation","source":"article-url"}]`;
  }

  /**
   * Validate generated questions against source articles for accuracy
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

      // Sort by quality (A > B > C)
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
   * Make HTTP request to Gemini API
   */
  async callGeminiAPI(prompt, generationConfig = null) {
    // Use dynamic generation config if not provided
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
   * Generate dynamic configuration for variety
   */
  getDynamicGenerationConfig() {
    // Array of different configuration profiles for variety
    const configProfiles = [
      { temperature: 0.7, topP: 0.8, name: 'balanced' },
      { temperature: 0.8, topP: 0.9, name: 'creative' },
      { temperature: 0.6, topP: 0.7, name: 'focused' },
      { temperature: 0.75, topP: 0.85, name: 'dynamic' },
      { temperature: 0.72, topP: 0.82, name: 'engaging' }
    ];
    
    // Randomly select a configuration profile
    const profile = configProfiles[Math.floor(Math.random() * configProfiles.length)];
    
    return {
      temperature: profile.temperature,
      topP: profile.topP,
      maxOutputTokens: 4096,
    };
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

      // Progressive JSON extraction - handle partial/truncated responses
      const contextArticles = request.contextArticles || [];
      const extractedQuestions = this.extractValidQuestionsFromContent(content, contextArticles);
      
      if (extractedQuestions.length === 0) {
        throw new Error('No valid questions found in response');
      }

      return extractedQuestions.map((q, index) => ({
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
   * Extract valid question objects from potentially truncated content
   */
  extractValidQuestionsFromContent(content, contextArticles = []) {
    // First try standard JSON extraction
    try {
      let jsonText = this.extractJSONFromContent(content);
      const result = JSON.parse(jsonText);
      return result;
    } catch (error) {
      // If standard parsing fails, try progressive extraction
      return this.progressiveQuestionExtraction(content, contextArticles);
    }
  }

  /**
   * Extract JSON text from content, handling markdown and formatting
   */
  extractJSONFromContent(content) {
    // Clean the content first
    const cleanedContent = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Try to extract from markdown code blocks
    let markdownMatch = cleanedContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (markdownMatch) {
      return this.cleanJSONText(markdownMatch[1]);
    }
    
    // Fallback to finding any JSON array
    let jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    return this.cleanJSONText(jsonMatch[0]);
  }

  /**
   * Clean JSON text for parsing
   */
  cleanJSONText(jsonText) {
    return jsonText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // Remove control chars
      .replace(/\/\/.*$/gm, '')  // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
      .replace(/\n/g, ' ')  // Replace newlines with spaces
      .replace(/\r/g, '')  // Remove carriage returns
      .replace(/\t/g, ' ')  // Replace tabs with spaces
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
  }

  /**
   * Progressive extraction for partial/truncated responses
   */
  progressiveQuestionExtraction(content, contextArticles = []) {
    const validQuestions = [];
    
    // Try to extract individual question objects
    const questionMatches = this.findQuestionObjectsInText(content);
    
    for (const questionMatch of questionMatches) {
      try {
        // Try to complete the question object if truncated
        const completedQuestion = this.completeQuestionObject(questionMatch, contextArticles);
        
        if (completedQuestion) {
          const cleanedQuestion = this.cleanJSONText(completedQuestion);
          try {
            const questionObj = JSON.parse(cleanedQuestion);
            
            // Validate the question has required fields
            if (this.validateQuestionObject(questionObj)) {
              validQuestions.push(questionObj);
            }
          } catch (parseError) {
            // Skip invalid question objects
            continue;
          }
        }
      } catch (error) {
        // Skip invalid question objects
        continue;
      }
    }
    
    return validQuestions;
  }

  /**
   * Find potential question objects in text
   */
  findQuestionObjectsInText(content) {
    const questions = [];
    
    // Clean content first
    const cleanedContent = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Pattern to find question objects
    const questionPattern = /\{\s*"question"\s*:\s*"[^"]*"/g;
    let match;
    
    while ((match = questionPattern.exec(cleanedContent)) !== null) {
      const startIndex = match.index;
      
      // Find the end of this question object
      let braceCount = 1;
      let endIndex = startIndex + match[0].length;
      
      for (let i = endIndex; i < cleanedContent.length && braceCount > 0; i++) {
        if (cleanedContent[i] === '{') braceCount++;
        else if (cleanedContent[i] === '}') braceCount--;
        
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
      
      questions.push(cleanedContent.substring(startIndex, endIndex));
    }
    
    return questions;
  }

  /**
   * Try to complete a truncated question object
   */
  completeQuestionObject(questionText, contextArticles = []) {
    // Check if we have the essential fields
    const hasQuestion = /"question"\s*:\s*"[^"]*"/.test(questionText);
    const hasOptions = /"options"\s*:\s*\[/.test(questionText);
    const hasCorrectAnswer = /"correctAnswer"\s*:\s*\d+/.test(questionText);
    
    if (hasQuestion && hasOptions && hasCorrectAnswer) {
      let completed = questionText.trim();
      
      // Extract question content to match with best source
      const questionMatch = completed.match(/"question"\s*:\s*"([^"]*)"/); 
      const questionContent = questionMatch ? questionMatch[1] : '';
      
      // Find the best matching article source
      const bestSource = this.findBestSourceForQuestion(questionContent, contextArticles);
      
      // If we have correctAnswer, add defaults for missing fields
      const correctAnswerMatch = completed.match(/"correctAnswer"\s*:\s*\d+/);
      if (correctAnswerMatch) {
        const endOfCorrectAnswer = correctAnswerMatch.index + correctAnswerMatch[0].length;
        completed = completed.substring(0, endOfCorrectAnswer) + 
                   `, "explanation": "Explanation based on article content", "source": "${bestSource}"}`;
        return completed;
      }
    }
    
    return null;
  }

  /**
   * Find the best source URL for a question
   */
  findBestSourceForQuestion(questionContent, contextArticles) {
    if (!contextArticles || contextArticles.length === 0) {
      return 'Generated from web sources';
    }
    
    // If only one article, use it
    if (contextArticles.length === 1) {
      return contextArticles[0].link || 'Generated from web sources';
    }
    
    // Score articles based on keyword overlap
    const questionWords = questionContent.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    let bestMatch = contextArticles[0];
    let bestScore = 0;
    
    for (const article of contextArticles) {
      const articleText = `${article.title || ''} ${article.snippet || ''}`.toLowerCase();
      const score = questionWords.filter(word => articleText.includes(word)).length;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = article;
      }
    }
    
    return bestMatch.link || 'Generated from web sources';
  }

  /**
   * Validate that a question object has all required fields
   */
  validateQuestionObject(questionObj) {
    return questionObj.question && 
           Array.isArray(questionObj.options) && 
           questionObj.options.length === 4 &&
           typeof questionObj.correctAnswer === 'number' &&
           questionObj.correctAnswer >= 0 && 
           questionObj.correctAnswer < 4;
  }

  /**
   * Get category-specific context
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
   * Get difficulty-specific guidance
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
   * Get era-specific context
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
   * Get country-specific context
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
   * Get question style-specific context
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
   * Build tutorial-specific prompt
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
    // Support both CLI and UI environments
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_GEMINI_API_KEY or GEMINI_API_KEY environment variable is required');
    }
    geminiServiceInstance = new GeminiService(apiKey);
  }
  return geminiServiceInstance;
};

/**
 * Platform-specific wrapper for backward compatibility
 */
export class CLIGeminiService {
  constructor() {
    this.service = getGeminiService();
  }

  /**
   * Generate questions from article context
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