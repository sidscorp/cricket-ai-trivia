# Learn Cricket Integration Guide

This document explains how to integrate the CLI LearnCricketService into the UI when ready.

## Overview

The Learn Cricket mode has been implemented with a reusable service (`LearnCricketService.js`) that can work with both CLI and UI. The CLI version is used for testing AI question quality and adaptation logic.

## Current Implementation

### CLI Components
1. **LearnCricketService.js** - Core service for question generation
   - Uses Perplexity Sonar model for factual cricket basics
   - Generates 6 questions per over
   - Adapts second over based on first over performance
   - Handles topic randomization and performance tracking

2. **learn-cricket.js** - CLI command for testing
   - Batch mode: Shows 6 questions, collects comma-separated answers
   - Displays results and explanations
   - Tests adaptation between overs

### UI Components
1. **LearnCricketScreen.tsx** - Existing UI implementation
   - Currently uses AIQuestionService with adaptive generation
   - Cricket-style gameplay with timer and scoring
   - One question at a time display

## Integration Steps

### Step 1: Port LearnCricketService to TypeScript

Create `/src/services/LearnCricketService.ts`:
```typescript
import { TriviaQuestion } from '../types/Question';
import { getOpenRouterService } from './OpenRouterService';

interface GenerationContext {
  overNumber: number;
  previousQuestions?: TriviaQuestion[];
  previousAnswers?: number[];
  performance?: PerformanceMetrics;
}

export class LearnCricketService {
  // Port the JavaScript implementation
  // Adapt generateOverQuestions() to return TriviaQuestion[]
}
```

### Step 2: Update AIQuestionService

Modify `AIQuestionService.ts` to use LearnCricketService for tutorial category:
```typescript
// In generateAdaptiveQuestions()
if (context.category === 'tutorial') {
  const learnService = new LearnCricketService();
  return learnService.generateOverQuestions({
    overNumber: this.getCurrentOver(),
    previousQuestions: this.previousQuestions,
    // ... other context
  });
}
```

### Step 3: Modify LearnCricketScreen Logic

Update the screen to pre-generate 6 questions per over:
```typescript
// In generateInitialQuestions()
const over1Questions = await learnService.generateOverQuestions({
  overNumber: 1
});
setQuestions(over1Questions);

// After over 1 completion
const over2Questions = await learnService.generateOverQuestions({
  overNumber: 2,
  previousQuestions: over1Questions,
  previousAnswers: userAnswers,
  performance: calculatePerformance()
});
```

### Step 4: Optimize for UI Experience

1. **Pre-generation**: Generate all 6 questions at over start
2. **Caching**: Store generated questions to avoid delays
3. **Loading states**: Show "Preparing over..." during generation
4. **Error handling**: Fallback questions if generation fails

## Key Differences: CLI vs UI

| Feature | CLI | UI |
|---------|-----|-----|
| Display | All 6 at once | One at a time |
| Input | Comma-separated | Individual selection |
| Timing | No timer | Timer per question |
| Scoring | Simple correct/incorrect | Cricket-style runs |
| Feedback | After each over | After each question |

## Testing Integration

1. Use CLI to test question quality:
   ```bash
   npm run cli learn-cricket
   ```

2. Compare generated questions between CLI and UI

3. Ensure adaptation logic works consistently

## Performance Considerations

- Perplexity Sonar is fast (~1-2s per batch)
- Generate questions during "Start Over" transitions
- Consider pre-generating next over during current over
- Cache questions to handle connection issues

## Future Enhancements

1. **Difficulty Progression**: Track overall progress across sessions
2. **Topic Focus**: Allow users to select specific topics to learn
3. **Achievement System**: Unlock topics as users progress
4. **Offline Mode**: Pre-generated question banks for offline play