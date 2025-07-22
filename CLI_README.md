# 🏏 Cricket Trivia CLI Test Tool

A command-line interface for testing the AI-powered cricket question generation pipeline with web search capabilities.

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

### OpenRouter API Key (Required)
1. Go to [OpenRouter](https://openrouter.ai/)
2. Create an account and get API key
3. Add to `.env` as `EXPO_PUBLIC_OPENROUTER_API_KEY`
4. Provides access to Perplexity Sonar, Claude, GPT-4, and other models

### Google Custom Search API (Optional - for verification features)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Custom Search JSON API
3. Create credentials (API Key)
4. Add to `.env` as `GOOGLE_CUSTOM_SEARCH_API_KEY`

### Google Custom Search Engine (Optional - for verification features)
1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Create a new search engine
3. Configure to search cricket websites (espncricinfo.com, cricbuzz.com, etc.)
4. Get the Search Engine ID and add to `.env` as `GOOGLE_CUSTOM_SEARCH_CX`

## 📋 Available Commands

### 🎯 search-generate - Main Question Generation Pipeline
**Two-phase pipeline: Web search → anecdote generation → question creation**

```bash
# Generate questions using default settings
npm run cli:questions

# Generate with specific filters
npm run cli:questions -- --era modern_era --countries india --anecdotes 5 --questions 8

# Use specific models
npm run cli:questions -- --search-model perplexitySonarPro --creative-model claude3Opus
```

**Features:**
- 🚀 **Parallel Processing**: Generates anecdotes and questions in parallel batches
- 🔍 **Web-Aware Search**: Uses Perplexity models with real-time web access
- 📊 **Quality Filtering**: Automatic quality scoring and filtering
- 🎯 **Multi-Model Support**: Choose from various models for different phases
- 🌐 **Source Attribution**: Includes web sources for fact-checking

**Options:**
- `-e, --era <era>`: Cricket era filter (default: "all_eras")
- `-c, --countries <csv>`: Comma-separated country filters
- `-g, --category <category>`: Question category
- `-a, --anecdotes <num>`: Number of anecdotes to generate (default: 10)
- `-q, --questions <num>`: Target number of questions
- `--search-model <model>`: Search model override
- `--creative-model <model>`: Creative model override
- `--json`: Output results as JSON

### 🏃 speed-test - Pipeline Performance Testing
**Test pipeline speed with different optimization settings**

```bash
# Compare serial vs parallel performance
npm run cli:speed -- --compare

# Test with fast models
npm run cli:speed -- --fast-models

# Custom test configuration
npm run cli:speed -- -c 3 -a 5 -q 8
```

### 🔍 verify - Web Verification Testing
**Test verification of cricket incidents using Google Custom Search**

```bash
# Verify a specific incident
npm run cli:verify -- -i "Sachin scored 100 centuries"

# Generate and verify an incident
npm run cli:verify -- -g

# Set confidence threshold
npm run cli:verify -- -i "Kapil Dev 1983 catch" -c 70
```

### 📊 performance - Performance Benchmarking
**Detailed performance testing and analysis**

```bash
# Test specific component
npm run cli:perf -- --component openrouter

# Test full pipeline
npm run cli:perf -- --component pipeline

# Multiple iterations
npm run cli:perf -- -n 5 --warmup 2
```

### 🎓 learn-cricket - Interactive Cricket Learning
**Adaptive difficulty cricket quiz in batch mode**

```bash
# Start learning mode
npm run cli:learn

# Compare fast vs regular implementation
npm run cli:learn-fast
```

### 🔎 search - Google Custom Search Testing
**Test Google Custom Search API directly**

```bash
# Search for cricket content
npm run cli:search -- -q "Sachin Tendulkar records" -n 5

# Search with specific start index
npm run cli:search -- -q "IPL 2024" -n 10 -s 11
```

## 🏗️ Architecture

The CLI uses a modular architecture with:

1. **Shared Services** (`shared/services/`)
   - `OpenRouterService.js`: Multi-model AI integration
   - `LearnCricketService.js`: Adaptive learning logic

2. **Command Modules** (`cli/commands/`)
   - Each command is a self-contained module
   - Shared utilities in `cli/utils/`

3. **Two-Phase Pipeline**:
   - **Phase 1**: Web search for cricket content (Perplexity)
   - **Phase 2**: Convert content to questions (Claude/GPT-4)

## 📈 Performance Targets

### Pipeline Performance
- **Target Time**: 20-30 seconds total
- **Phase 1**: 10-15 seconds for anecdotes
- **Phase 2**: 10-15 seconds for questions
- **Success Rate**: >90% successful generations

## 🔧 Development

### Adding a New Command
1. Create new file in `cli/commands/`
2. Export a Commander command
3. Register in `cli/index.js`

### Testing
```bash
# Run all tests
npm test

# Test specific command
npm run cli:perf -- --component openrouter --warmup 0 -n 1
```

## 📝 Environment Variables

```env
# Required
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key

# Optional (for verification features)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key
GOOGLE_CUSTOM_SEARCH_CX=your_search_engine_id
```

## 🐛 Troubleshooting

### "No JSON structure found in response"
- The AI model returned non-JSON format
- The pipeline has fallback parsing strategies

### Performance test shows failed
- Check if questions were actually generated
- Look for successful test results in debug output

### API Rate Limits
- OpenRouter has rate limits per model
- Use `--fast-models` for higher limits
- Implement delays between requests if needed