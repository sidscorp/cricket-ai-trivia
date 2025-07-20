# 🏏 Cricket Trivia Codebase Guide

A comprehensive guide to understanding the cricket trivia application architecture, featuring an AI-powered question generation engine with React Native mobile interface.

## 📁 Project Overview

This is a dual-platform project combining:
- **React Native Mobile App**: Cross-platform cricket trivia game
- **CLI Testing Framework**: Advanced AI question generation pipeline testing
- **AI Services**: Gemini-powered question generation with web verification

## 🗂️ Directory Structure

```
cricket-trivia/
├── 📱 Mobile App (React Native)
│   ├── App.tsx                    # Main mobile app entry point
│   ├── TriviaGame.tsx             # Legacy trivia game component
│   ├── index.ts                   # Expo entry point
│   ├── app.json                   # Expo configuration
│   ├── assets/                    # App icons and images
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

### Commands (`cli/commands/`)

#### **`search-generate.js`** ⭐ Primary Command
- **Purpose**: Intelligent question generation with guaranteed output
- **Features**:
  - Adaptive article fetching (15-50 articles automatically)
  - 3x over-generation strategy (generate 15 to get 5 final questions)
  - Cricket content quality scoring
  - Diverse source sampling to prevent clustering
  - A/B/C quality validation ranking
- **Usage**: `node cli/index.js search-generate --questions 5 --era modern_era`
- **Key Innovation**: Guarantees minimum question count through dynamic expansion

#### **`grounded.js`**
- **Purpose**: Enhanced storytelling with web search grounding
- **Features**: Real-time web verification, rich narrative context
- **Usage**: `node cli/index.js grounded --type question --era world_cup_era`

#### **`generate.js`**
- **Purpose**: Basic AI question generation testing
- **Features**: Direct Gemini API testing, filter validation
- **Usage**: `node cli/index.js generate --interactive`

#### **`verify.js`**
- **Purpose**: Web verification of cricket incidents
- **Features**: Google Custom Search validation, confidence scoring
- **Usage**: `node cli/index.js verify --generate --confidence 70`

#### **`pipeline.js`**
- **Purpose**: End-to-end pipeline testing
- **Features**: Complete generation + verification workflow
- **Usage**: `node cli/index.js pipeline --count 3 --detailed`

#### **`performance.js`**
- **Purpose**: Performance benchmarking and optimization
- **Features**: Timing analysis, success rate monitoring, concurrent testing
- **Usage**: `node cli/index.js performance --count 10 --target 3000`

#### **`search.js`**
- **Purpose**: Google Custom Search API testing
- **Features**: Search term validation, result analysis
- **Usage**: `node cli/index.js search --query "cricket legends"`

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

#### **Archived Services** (`cli/services/archived/`)
- **`enhanced-gemini.js`**: Legacy enhanced question generation
- **`grounded-gemini.js`**: Legacy web-grounded generation
- **Note**: Kept for reference, replaced by unified GeminiService

### Utilities (`cli/utils/`)

#### **`config.js`**
- **Purpose**: Configuration management for CLI tools
- **Features**: API key handling, environment variable management
- **Contains**: Gemini API, Google Search API configuration

#### **`performance.js`**
- **Purpose**: Performance monitoring and analysis utilities
- **Features**: Timing measurement, success rate calculation, benchmark reporting

#### **`url-resolver.js`**
- **Purpose**: URL processing and validation utilities
- **Features**: Link extraction, domain validation, redirect handling

---

## 📱 Root Level Files

### App Entry Points
- **`App.tsx`**: Main React Native application component
- **`TriviaGame.tsx`**: Legacy root game component (being migrated to src/)
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
- **`NEXT_SESSION_TASKS.md`**: Development roadmap and epic tracking

### AI Assistant Configuration
- **`claude.md`**: Instructions and context for AI development assistant

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
- **Advanced CLI testing framework** with 7 commands
- **Intelligent question pipeline** with guaranteed quantity
- **Factual validation system** eliminating subjective content
- **Performance optimization** targeting 3-4 second generation

### Next Development Priorities
- **Epic 6**: Search-driven content pipeline integration
- **UI Integration**: Enhanced mobile app features
- **Quality Assurance**: Additional validation layers
- **Performance**: Further optimization and caching

---

*This guide provides a comprehensive overview of the cricket trivia codebase. For specific implementation details, refer to individual file documentation and the CLI_README.md for command usage.*