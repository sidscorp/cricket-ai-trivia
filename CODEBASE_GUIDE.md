# 🏏 Cricket Trivia Codebase Guide

A comprehensive guide to understanding the cricket trivia application architecture, featuring an AI-powered question generation engine with React Native mobile interface.

## 📁 Project Overview

This is a dual-platform project combining:
- **React Native Mobile App**: Cross-platform cricket trivia game
- **CLI Testing Framework**: Advanced AI question generation pipeline testing
- **AI Services**: Multi-model AI integration for question generation
  - **V1 Pipeline**: Google Custom Search → Gemini for direct question generation
  - **V2 Pipeline**: OpenRouter (Perplexity Sonar → Claude/GPT-4) for two-phase generation

## 🗂️ Directory Structure

```
cricket-trivia/
├── 📱 Mobile App (React Native)
│   ├── App.tsx                    # Main mobile app entry point
│   ├── index.ts                   # Expo entry point
│   ├── app.json                   # Expo configuration
│   ├── assets/                    # App icons, images, and branding
│   │   ├── branding/              # CAT mascot and brand assets
│   │   │   └── mascot_cat_with_bat.png  # Main mascot image
│   │   ├── adaptive-icon.png      # Android adaptive icon
│   │   ├── favicon.png            # Web favicon
│   │   ├── icon.png               # Main app icon
│   │   └── splash-icon.png        # Splash screen icon
│   └── src/                       # Main source code
│
├── 🖥️ CLI Testing Framework
│   └── cli/                       # Command-line testing tools
│
├── 📚 Documentation
│   ├── README.md                  # Main project documentation
│   ├── CLI_README.md              # CLI usage guide
│   ├── TESTING_GUIDE.md           # Testing procedures
│   └── NEXT_SESSION_TASKS.md      # Development roadmap
│
└── ⚙️ Configuration
    ├── package.json               # Dependencies and scripts
    ├── tsconfig.json              # TypeScript configuration
    └── claude.md                  # AI assistant instructions
```

---

## 📱 Mobile App Components (`src/`)

### Core Components
- **`src/components/TriviaGame.tsx`**
  - Primary trivia game interface component
  - Handles question display, answer selection, scoring
  - Integrates with AI question generation service
  - Implements game modes: practice vs. fixed rounds

### Services Layer
- **`src/services/GeminiService.ts`**
  - TypeScript service for AI question generation
  - Interfaces with Google Gemini AI API
  - Handles question validation and formatting
  - Used by React Native app components

### Type Definitions
- **`src/types/Question.ts`**
  - TypeScript interfaces for trivia questions
  - Defines question structure, categories, difficulty levels
  - Ensures type safety across the application

### Utilities
- **`src/utils/QuestionValidator.ts`**
  - Validates AI-generated questions for quality
  - Checks cricket context, structure, engagement
  - Provides auto-fix capabilities for common issues

- **`src/utils/SearchTermGenerator.ts`**
  - Generates search terms based on user filters
  - Handles era, country, and category combinations
  - Creates varied search patterns for content discovery

---

## 🖥️ CLI Testing Framework (`cli/`)

The CLI system provides comprehensive testing for the AI question generation pipeline.

### Entry Point
- **`cli/index.js`**
  - Main CLI application entry point
  - Registers all available commands
  - Handles command routing and error management

### Commands (`cli/commands/`) - 4 Core Commands

#### **`search-generate.js`** ⭐ Main Production Command
- **Purpose**: Primary intelligent pipeline with guaranteed question delivery
- **Status**: ✅ Fully functional - core production system
- **Features**:
  - Adaptive article fetching (15-50 articles automatically)
  - 3x over-generation strategy (generate 15 to get 5 final questions)
  - Cricket content quality scoring
  - Diverse source sampling to prevent clustering
  - A/B/C quality validation ranking
- **Usage**: `npm run cli search-generate --questions 5 --era modern_era`
- **Key Innovation**: Guarantees minimum question count through dynamic expansion

#### **`verify.js`** 🔍 Web Verification Command
- **Purpose**: Verifies cricket facts using Google Custom Search
- **Status**: ✅ Fully functional - confidence scoring and source analysis
- **Features**: Google Custom Search validation, confidence scoring, source quality ranking
- **Usage**: `npm run cli verify --incident "cricket fact" --confidence 80 --show-sources`

#### **`search.js`** 🔍 Search API Testing
- **Purpose**: Direct Google Custom Search API testing and validation
- **Status**: ✅ Fully functional - validates search configuration
- **Features**: Search term validation, result analysis, response time monitoring
- **Usage**: `npm run cli search --query "cricket legends"`

#### **`performance.js`** ⚡ Performance Benchmarking
- **Purpose**: Performance testing and pipeline optimization
- **Status**: ⚠️ Partially functional - timing analysis with some method compatibility issues
- **Features**: Timing analysis, success rate monitoring, memory usage tracking
- **Usage**: `npm run cli performance --count 5 --target 3000`

### Services (`cli/services/`)

#### **`GeminiService.js`** 🧠 Core AI Engine
- **Purpose**: JavaScript implementation of Gemini AI integration
- **Key Features**:
  - **Adaptive Configuration**: Dynamic temperature/topP based on difficulty/category
  - **Factual Question Framework**: Extracts concrete cricket facts vs. opinions
  - **Multi-layer Validation**: A/B/C quality ranking with fact-checking
  - **Enhanced Prompts**: 25+ search variations, story-driven templates
- **Methods**:
  - `generateQuestions()`: Main question generation with validation
  - `buildContextArticlesPrompt()`: Article-based factual question creation
  - `validateQuestionsAgainstArticles()`: AI fact-checking validation
  - `getDynamicConfigForRequest()`: Adaptive AI parameters

#### **`google-search.js`**
- **Purpose**: Google Custom Search API integration
- **Features**: Cricket-focused search, result filtering, confidence scoring
- **Usage**: Used by verification and grounded commands

#### **`OpenRouterService.js`** 🌐 Multi-Model AI Integration
- **Purpose**: Unified interface for accessing various AI models via OpenRouter
- **Key Features**:
  - **Multi-Model Support**: Perplexity Sonar (search), Claude, GPT-4 (creative)
  - **Two-Phase Pipeline**: Anecdote generation → Question creation
  - **Enhanced Randomization**: Timestamp + seed based variations
  - **Source Attribution**: Maintains citation chain through pipeline
- **Methods**:
  - `generateAnecdotes()`: Web-aware anecdote generation with Perplexity
  - `generateQuestionsFromAnecdotes()`: Creative question generation
  - `generateEnhancedSearchContext()`: Dynamic search context with randomization
- **Model Configuration**:
  - Search Models: perplexity/sonar, perplexity/sonar-pro, perplexity/sonar-reasoning, openai/gpt-4o:online
  - Creative Models: anthropic/claude-3-sonnet, anthropic/claude-3-opus, openai/gpt-4, openai/gpt-4-turbo

#### **`AnecdoteGenerator.js`** 🎪 Phase 1 - Web-Aware Content Generation
- **Purpose**: Generate cricket anecdotes using web search capabilities
- **Key Features**:
  - **Perplexity Integration**: Uses Sonar models for web-aware content generation
  - **Enhanced Filtering**: Adds temporal and contextual variations for randomness
  - **Quality Scoring**: Validates and scores anecdotes based on drama, facts, sources
  - **Content Optimization**: Extracts drama tags and calculates engagement metrics
- **Methods**:
  - `generateAnecdotes()`: Main anecdote generation with validation
  - `validateAnecdoteCount()`: Ensures count within configured limits
  - `enhanceAnecdote()`: Adds metadata and quality scoring
  - `calculateQualityScore()`: Scores based on length, facts, drama, sources

#### **`QuestionGenerator.js`** ✍️ Phase 2 - Creative Question Generation  
- **Purpose**: Transform anecdotes into engaging trivia questions
- **Key Features**:
  - **Fast Model Selection**: Prioritizes Claude Sonnet for speed and cost-effectiveness
  - **Quality-Based Selection**: Chooses best anecdotes based on quality scores
  - **Batch Processing**: Handles large anecdote sets efficiently
  - **Answer Complexity**: Analyzes option variety and question structure
- **Methods**:
  - `generateQuestions()`: Main question generation from anecdotes
  - `selectBestAnecdotes()`: Quality-based anecdote selection
  - `calculateQuestionQuality()`: Scores questions on structure and engagement
  - `generateQuestionsInBatches()`: Batch processing for large datasets


### Utilities (`cli/utils/`)

#### **`config.js`**
- **Purpose**: Configuration management for CLI tools
- **Features**: API key handling, environment variable management
- **Contains**: 
  - Gemini API configuration
  - Google Search API configuration
  - OpenRouter API configuration (models, pipeline settings)
  - V2 pipeline parameters (anecdote count, questions per anecdote)

#### **`performance.js`**
- **Purpose**: Performance monitoring and analysis utilities
- **Features**: Timing measurement, success rate calculation, benchmark reporting

#### **`url-resolver.js`**
- **Purpose**: URL processing and validation utilities
- **Features**: Link extraction, domain validation, redirect handling

---

## 🎨 Branding Assets

### **`assets/branding/mascot_cat_with_bat.png`**
- **Purpose**: Main CAT (Cricket AI Trivia) mascot image
- **Description**: Anthropomorphic cricket-playing cat in professional batting kit
- **Usage**: Featured in README.md, potential app icon, branding materials
- **Generation**: Created with ChatGPT's DALL-E using prompt: *"Full-body portrait of an anthropomorphic cartoon cat in professional cricket batting kit, poised at crease ready for first ball, heroic slight upward camera angle, World XI jersey (WORLD XI text clear), realistic stadium backdrop softly defocused, late afternoon warm light with cool shadow balance, detailed bat grain, stylized fur with gentle specular highlights, cinematic depth, photoreal environment + charming cartoon subject hybrid, high resolution."*

---

## 📱 Root Level Files

### App Entry Points
- **`App.tsx`**: Main React Native application component
- **`index.ts`**: Expo framework entry point

### Configuration Files
- **`package.json`**: 
  - Dependencies: React Native, Expo, Gemini API, Google APIs
  - Scripts: `npm run cli` for CLI access, Expo development commands
  - Type: ES Module with TypeScript support

- **`tsconfig.json`**: TypeScript configuration for the project
- **`app.json`**: Expo configuration for mobile app deployment

### Documentation
- **`README.md`**: Main project documentation and setup instructions
- **`CLI_README.md`**: Comprehensive CLI command reference and usage guide
- **`TESTING_GUIDE.md`**: Testing procedures and quality assurance guidelines
- **`FRESH_INSTALL_TEST.md`**: Step-by-step fresh installation testing guide

### Environment Configuration
- **`.env`**: Production environment variables with actual API keys
- **`.env.example`**: Template file showing required environment variables
- **`.env.local`**: Local development environment overrides
- **Note**: `.env` files contain sensitive API keys and are excluded from git

### AI Assistant Configuration
- **`claude.md`**: Instructions and context for AI development assistant

### Development Dependencies
- **`package-lock.json`**: NPM dependency lock file ensuring consistent installs
- **`node_modules/`**: Installed Node.js dependencies and packages

### Assets
- **`assets/`**: Contains app icons, splash screens, and mobile app imagery

---

## 🔄 Data Flow Architecture

### Question Generation Pipeline
1. **Input**: User filters (era, country, category, difficulty)
2. **Search**: Dynamic term generation → Google Custom Search
3. **Processing**: Article quality scoring → source diversification
4. **Generation**: 3x over-generation via Gemini AI
5. **Validation**: Factual accuracy checking → A/B/C ranking
6. **Selection**: Best questions chosen → guaranteed count delivery

### Mobile App Flow
1. **UI**: TriviaGame component renders questions
2. **Service**: GeminiService.ts generates questions on-demand
3. **Validation**: QuestionValidator ensures quality
4. **State**: React Native manages game state and scoring

### CLI Testing Flow
1. **Commands**: User runs specific test command
2. **Services**: CLI services execute AI operations
3. **Validation**: Multi-layer quality assurance
4. **Reporting**: Detailed performance and quality metrics

---

## 🛠️ Technology Stack

### Frontend
- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe development with interfaces
- **AsyncStorage**: Persistent data storage

### Backend/AI
- **Google Gemini AI**: Question generation and validation
- **Google Custom Search**: Web content verification
- **Node.js**: CLI framework and testing tools

### Development Tools
- **Commander.js**: CLI command framework
- **Chalk**: Terminal output formatting
- **Inquirer**: Interactive CLI prompts
- **Ora**: Loading spinners and progress indicators

---

## 🎯 Key Innovations

### Intelligent Question Pool Management
- **Adaptive Fetching**: Automatically scales article collection based on quality
- **Over-Generation**: Creates 3x more questions than needed for better selection
- **Quality Scoring**: Ranks articles and questions for cricket relevance

### Factual Question Framework
- **Fact Extraction**: Identifies concrete cricket events vs. subjective opinions
- **Event-Centric**: Questions test cricket knowledge, not article comprehension
- **Multi-layer Validation**: AI fact-checking with A/B/C quality ranking

### Enhanced Randomization
- **25+ Search Variations**: Dynamic search terms with dramatic modifiers
- **Source Diversity**: Prevents clustering from same sources
- **Dynamic AI Configuration**: Adaptive temperature/topP for generation variety

---

## 📈 Current Status

### Completed Features ✅
- **Mobile trivia game** with AI question generation
- **Streamlined CLI testing framework** with 4 core commands
- **Intelligent question pipeline** with guaranteed quantity (search-generate)
- **Factual validation system** eliminating subjective content
- **Web verification system** with confidence scoring (verify)
- **Performance optimization** targeting 3-4 second generation

### Next Development Priorities
- **Epic 6**: Search-driven content pipeline integration
- **UI Integration**: Enhanced mobile app features
- **Quality Assurance**: Additional validation layers
- **Performance**: Further optimization and caching

---

*This guide provides a comprehensive overview of the cricket trivia codebase. For specific implementation details, refer to individual file documentation and the CLI_README.md for command usage.*