# 🏏 Cricket Trivia CLI Test Tool

A command-line interface for testing the AI-powered cricket question generation pipeline with Google Custom Search verification.

## 🚀 Quick Start

1. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Install Dependencies** (already done)
   ```bash
   npm install
   ```

3. **Test the CLI**
   ```bash
   npm run cli help
   ```

## 🔑 Required API Keys

### Gemini AI API Key (Required for V1)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add to `.env` as `EXPO_PUBLIC_GEMINI_API_KEY`

### Google Custom Search API (Required for V1)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Custom Search JSON API
3. Create credentials (API Key)
4. Add to `.env` as `GOOGLE_CUSTOM_SEARCH_API_KEY`

### Google Custom Search Engine (Required for V1)
1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Create a new search engine
3. Configure to search cricket websites (espncricinfo.com, cricbuzz.com, etc.)
4. Get the Search Engine ID and add to `.env` as `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

### OpenRouter API Key (Required for V2)
1. Go to [OpenRouter](https://openrouter.ai/)
2. Create an account and get API key
3. Add to `.env` as `OPENROUTER_API_KEY`
4. Provides access to Perplexity Sonar, Claude, GPT-4, and other models

## 📋 Available Commands

### 🎯 search-generate - V1 Production Command (Gemini)
**Google Custom Search + Gemini AI pipeline**

```bash
# Generate 5 guaranteed high-quality questions
npm run cli search-generate --questions 5

# Generate with specific filters
npm run cli search-generate --questions 3 --era modern_era --country india

# Generate with different difficulty
npm run cli search-generate --questions 5 --difficulty hard
```

**Features:**
- ✅ **Guaranteed Question Count**: Always delivers the requested number of questions
- 🔍 **Adaptive Article Fetching**: Automatically scales from 15-50 articles based on quality
- 📊 **3x Over-Generation**: Creates more questions than needed and selects the best
- 🎯 **A/B/C Quality Validation**: Multi-layer quality ranking system
- 🌐 **Source Diversification**: Prevents content clustering from same sources

**Options:**
- `--questions <number>`: Number of questions to generate (required)
- `--era <era>`: Cricket era filter
- `--country <country>`: Country filter  
- `--difficulty <difficulty>`: Difficulty level
- `--json`: Output results as JSON

### 🚀 search-generate-v2 - V2 Production Command (OpenRouter)
**Advanced two-phase pipeline: Perplexity web search → anecdote generation → question creation**

```bash
# Generate questions using V2 pipeline
npm run cli:questions-v2 --era modern_era --countries india --anecdotes 5 --questions 8

# Advanced usage with model selection
npm run cli:questions-v2 \
  --era contemporary \
  --countries india,australia \
  --category legendary_moments \
  --anecdotes 10 \
  --questions 15 \
  --search-model perplexitySonarPro \
  --creative-model claude3Opus \
  --show-anecdotes

# Quick test with debug mode
npm run cli:questions-v2 --anecdotes 3 --questions 5 --debug
```

**Features:**
- 🔍 **Phase 1**: Perplexity Sonar generates cricket anecdotes with web search
- ✍️ **Phase 2**: Claude/GPT-4 transforms anecdotes into trivia questions  
- 🎯 **Enhanced Filters**: 5 new dimensions (matchType, conditions, tournament, playerRole)
- 🎲 **Maximum Randomization**: 100% unique search seeds, 94%+ context variety
- 📊 **Quality Scoring**: Advanced quality metrics for anecdotes and questions
- ⚡ **Smart Model Selection**: Fast models for Phase 2, powerful models for Phase 1

**Options:**
- `--era <era>`: Cricket era filter (default: all_eras)
- `--countries <csv>`: Comma-separated countries (default: all_countries)
- `--category <category>`: Question category (default: legendary_moments)
- `--anecdotes <num>`: Number of anecdotes to generate (default: 10)
- `--questions <num>`: Target number of questions (optional, auto-calculated)
- `--search-model <model>`: Override search model (perplexitySonar, perplexitySonarPro, etc.)
- `--creative-model <model>`: Override creative model (claude3Sonnet, claude3Opus, gpt4, etc.)
- `--batch-size <num>`: Batch size for question generation (default: auto)
- `--show-anecdotes`: Display generated anecdotes in output
- `--json`: Output questions in JSON format
- `--debug`: Enable debug output

### 🔍 verify - Web Verification Command
Test web verification of cricket incidents using Google Custom Search.

```bash
# Verify a specific cricket fact
npm run cli verify --incident "Virat Kohli scored 183 runs against Pakistan in 2012 Asia Cup"

# Show detailed source information  
npm run cli verify --incident "MS Dhoni helicopter shot 2011 World Cup final" --show-sources

# Set confidence threshold
npm run cli verify --incident "Shane Warne 700th wicket" --confidence 80
```

**Features:**
- 🎯 **Confidence Scoring**: 0-100% verification confidence with detailed analysis
- 🌟 **Source Quality Ranking**: Identifies high-quality cricket sources
- 📊 **Multi-Factor Analysis**: Credibility, relevance, and authority scoring
- 🔗 **Source Attribution**: Direct links to supporting articles

**Options:**
- `--incident <text>`: Cricket incident text to verify (required)
- `--show-sources`: Show detailed source information and scoring
- `--confidence <threshold>`: Minimum confidence threshold (0-100, default: 60)
- `--json`: Output results as JSON

### 🔍 search - Google Custom Search Testing  
Direct testing of Google Custom Search API with cricket queries.

```bash
# Test search with cricket query
npm run cli search --query "cricket legends"

# Search for specific events
npm run cli search --query "2011 world cup final dhoni six"

# Test search engine configuration
npm run cli search --query "virat kohli centuries"
```

**Features:**
- 🌐 **Direct API Testing**: Tests Google Custom Search integration
- 📋 **Result Formatting**: Clean display of search results with relevance
- 🔍 **Query Validation**: Ensures search engine is properly configured
- 📊 **Response Analysis**: Shows result counts and response times

**Options:**
- `--query <text>`: Search query to test (required)
- `--num <number>`: Number of results to return (default: 10)
- `--start <number>`: Starting index for results (default: 1)

### ⚡ performance - Performance Benchmarking
Performance testing and benchmarking for pipeline optimization.

```bash
# Test pipeline performance
npm run cli performance --count 3 --target 3000

# Extended performance test  
npm run cli performance --count 5 --target 2500

# Test with different parameters
npm run cli performance --count 2 --warmup 1
```

**Features:**
- ⏱️ **Response Time Monitoring**: Tracks generation speed and targets
- 🎯 **Success Rate Analysis**: Monitors pipeline reliability
- 📊 **Performance Metrics**: Detailed timing breakdown and memory usage
- 🔥 **Warmup Support**: Ensures accurate performance measurements

**Options:**
- `--count <number>`: Number of test iterations (default: 5)
- `--target <ms>`: Target time in milliseconds (default: 4000)  
- `--warmup <number>`: Warmup iterations (default: 2)
- `--concurrent <number>`: Concurrent requests (default: 1)

## 🎯 Performance Targets

- **Target Time**: 3-4 seconds per question
- **Success Rate**: >95% successful generations
- **Verification Rate**: >70% verified incidents
- **Consistency**: Low variance in timing

## 📊 Understanding Results

### Confidence Scores
- **80-100%**: High confidence, multiple reliable sources
- **60-79%**: Good confidence, verified by search
- **40-59%**: Moderate confidence, some supporting evidence
- **0-39%**: Low confidence, insufficient verification

### Performance Grades
- **Excellent**: <75% of target time
- **Good**: Within target time
- **Acceptable**: <150% of target time
- **Poor**: >150% of target time

## 🛠️ Troubleshooting

### Common Issues

1. **Missing API Keys**
   ```
   ❌ Missing required environment variables
   ```
   - Check your `.env` file
   - Ensure all three API keys are set

2. **API Rate Limits**
   ```
   ❌ Generation failed: 429 Too Many Requests
   ```
   - Reduce concurrent testing
   - Wait before retrying
   - Check API quotas

3. **Poor Verification Scores**
   ```
   🔍 Low verification rate
   ```
   - Use more specific incidents
   - Focus on well-documented events
   - Lower confidence threshold

4. **Slow Performance**
   ```
   🐌 Performance above target
   ```
   - Check internet connection
   - Reduce search result count
   - Use simpler prompts

## 📁 Project Structure

```
cli/
├── index.js              # Main CLI entry point
├── commands/
│   ├── generate.js       # Generation testing
│   ├── verify.js         # Verification testing  
│   ├── pipeline.js       # End-to-end testing
│   └── performance.js    # Performance benchmarking
├── services/
│   ├── enhanced-gemini.js    # AI incident generation
│   └── google-search.js      # Web verification
└── utils/
    ├── config.js         # Configuration management
    └── performance.js    # Performance monitoring
```

## 🧪 Example Workflow

1. **Test Enhanced Storytelling (RECOMMENDED)**
   ```bash
   node cli/index.js grounded --type question --era world_cup_era --country india
   ```

2. **Test Web-Verified Incidents**
   ```bash
   node cli/index.js grounded --type incident --era modern_era --interactive
   ```

3. **Performance Benchmarking**
   ```bash
   node cli/index.js performance --count 10 --component grounded
   ```

4. **Legacy Pipeline Testing**
   ```bash
   node cli/index.js pipeline --count 3 --detailed --no-verify
   ```

## ✅ Epic 1 Status: COMPLETED

**Achievements:**
- ✅ Real-time web verification with Gemini search grounding
- ✅ Performance targets met (3-4 seconds per question)
- ✅ Enhanced storytelling with rich narrative context
- ✅ Complete CLI testing framework ready for production

## 🎯 Next Steps

Epic 1 foundation ready for:
1. **Epic 2**: Context management and filter accuracy
2. **Epic 3**: Performance optimization and reliability  
3. **Epic 4**: Quality assurance and source attribution
4. **Epic 5**: React Native app integration