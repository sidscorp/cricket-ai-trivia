# 🏏 Cricket AI Trivia

<div align="center">
  <img src="assets/branding/mascot_cat_with_bat.png" alt="Cricket AI Trivia Mascot" width="200"/>
</div>

An experimental AI-powered cricket trivia generator exploring different approaches to create engaging, factually accurate questions.

## Project Overview

This project started from a simple idea: can we build an AI system that generates genuinely interesting cricket trivia? The approach I'm exploring involves:

1. **Web Search → Anecdotes**: Using AI to find interesting cricket stories and facts from the web
2. **Anecdotes → Questions**: Converting those stories into engaging trivia questions
3. **Optimization**: Balancing speed vs quality (and eventually, factual accuracy)

What I'm really after is creating questions that are both engaging AND informative - not just dry Q&A. Good trivia should tell a story, build tension, and teach something interesting. This means the AI needs to understand what makes a good trivia master: timing, narrative, surprise elements, and the ability to make facts memorable. That's another layer of complexity beyond just getting the facts right.

The challenge is that this pipeline can be slow, and there's a constant trade-off between generation speed and question quality. Adding factual verification will add another layer of complexity and time.

## Current State

### What's Working
- **Basic Pipeline**: Web search → anecdote generation → question creation flow
- **Multiple AI Models**: Testing with Gemini, GPT-3.5, Claude via OpenRouter
- **Learn Cricket Mode**: Interactive quiz format with cricket-style scoring
- **Mobile UI**: React Native app (with some sequencing bugs to fix)

### What I'm Exploring
- **Model Fine-tuning**: Considering training a cricket-specific model
- **Speed Optimization**: Various approaches to reduce generation time
- **Quality vs Speed**: Finding the right balance for engaging gameplay
- **Factual Accuracy**: Future layer to verify cricket facts (will add time)

## Learning Goals

This project is my playground for:
- Learning JavaScript/TypeScript app development
- Hands-on testing of AI model configurations
- Understanding how to "mix and match" information using LLMs
- Finding the best approach for this specific use case

What fascinates me is that there are countless ways to combine these AI models to transform information. It's all about finding what works best for your specific purpose.

## Technical Setup

### Prerequisites
- Node.js 18+ and npm
- API keys for Gemini, Google Search, and OpenRouter

### Quick Start
```bash
# Clone and install
git clone https://github.com/sidscorp/cricket-ai-trivia.git
cd cricket-ai-trivia
npm install

# Configure environment
cp .env.example .env
# Add your API keys to .env

# Try the CLI
npm run cli:learn       # Interactive quiz
npm run cli:questions   # Generate trivia

# Start mobile app
npm start
```

### Environment Variables
```
EXPO_PUBLIC_GEMINI_API_KEY=your_key
GOOGLE_CUSTOM_SEARCH_API_KEY=your_key
GOOGLE_CUSTOM_SEARCH_CX=your_engine_id
EXPO_PUBLIC_OPENROUTER_API_KEY=your_key
```

## Architecture Notes

The codebase reflects my iterative approach:
- `shared/services/` - Unified AI service implementations
- `cli/` - Command-line tools for testing different approaches
- `cli/experimental/` - Various optimization experiments
- `src/` - React Native mobile app
- `legacy/` - Earlier implementations I've moved on from

## Contributing

This is a learning project, but contributions are welcome! Feel free to:
- Suggest optimization approaches
- Share ideas for better AI pipelines
- Help fix UI bugs
- Experiment with different model configurations

## About

Created by **Sidd Nambiar** as a learning project combining my interests in cricket, AI, and app development.

---

*This project is about exploring what's possible when you combine web search, multiple AI models, and a specific domain focus. The journey is as interesting as the destination.*