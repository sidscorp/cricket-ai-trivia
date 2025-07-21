# Shared Cricket Trivia Modules

This directory contains shared code used by both the CLI and React Native UI for the Cricket Trivia game.

## Structure

```
shared/
├── config/              # Shared configuration files
│   ├── ai-models.js     # AI model definitions and selection
│   ├── cricket-topics.js # Cricket topics for questions
│   └── constants.js     # Game constants
├── services/            # Shared business logic
│   └── LearnCricketService.js # Main service for Learn Cricket mode
└── types/               # TypeScript definitions
    └── learn-cricket.d.ts # Type definitions for UI
```

## Key Features

### 1. Unified AI Model Configuration

Change the AI model in one place to affect both CLI and UI:

```javascript
// In shared/config/ai-models.js
AI_MODELS.learn_cricket.default = 'openai/gpt-3.5-turbo'; // Fast
// or
AI_MODELS.learn_cricket.default = 'perplexity/sonar'; // More accurate
```

### 2. Environment Variable Override

Set the model via environment variable:
- CLI: `LEARN_CRICKET_MODEL=quality npm run cli:learn`
- UI: Set `EXPO_PUBLIC_LEARN_CRICKET_MODEL=quality` in `.env`

### 3. Platform Adapters

- **CLI**: Uses `LearnCricketCLIAdapter.js` with chalk logging
- **UI**: Uses `LearnCricketUIAdapter.ts` with TypeScript support

## Usage

### CLI
```javascript
import { getLearnCricketService } from './cli/services/LearnCricketCLIAdapter.js';

const service = getLearnCricketService();
const questions = await service.generateOverQuestions({ overNumber: 1 });
```

### UI (React Native)
```typescript
import { getLearnCricketUIService } from './src/services/LearnCricketUIAdapter';

const service = getLearnCricketUIService();
const questions = await service.generateOverQuestions(1);
```

## Available Models

| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| `openai/gpt-3.5-turbo` | Fast (1-3s) | Good | Low |
| `perplexity/sonar` | Medium (5-10s) | Excellent | Medium |
| `meta-llama/llama-3.1-8b-instruct:free` | Fast (1-3s) | Good | Free |
| `anthropic/claude-3-haiku` | Fast (1-2s) | Very Good | Low |

## Testing

```bash
# Test CLI implementation
npm run cli:learn

# Test different models
npm run cli:learn-fast -- --mode fast

# Set custom model via environment
LEARN_CRICKET_MODEL=quality npm run cli:learn
```