# Cricket Trivia App

An AI-powered mobile trivia application that generates engaging cricket questions using Google's Gemini AI.

## Features

### Core Functionality
- **AI-Generated Questions**: Dynamic cricket trivia questions created by Gemini AI
- **Contextual Learning**: Questions include historical context and detailed explanations
- **Multiple Difficulty Levels**: Easy, medium, and hard questions
- **Diverse Categories**: Legendary moments, player stories, records, rules, and cultural impact
- **Practice Mode**: Unlimited questions for continuous learning
- **Game Mode**: Fixed set of questions with scoring

### Technical Implementation
- **React Native with Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe development with proper interfaces
- **Gemini AI Integration**: Real-time question generation
- **Question Validation**: Quality control for AI-generated content
- **Live Reload Development**: Instant updates during development

## Project Structure

```
src/
├── components/
│   └── TriviaGame.tsx          # Main game interface component
├── services/
│   └── GeminiService.ts        # Gemini AI integration service
├── types/
│   └── Question.ts             # TypeScript type definitions
└── utils/
    └── QuestionValidator.ts    # Question quality validation
```

## Development Setup

### Prerequisites
- Node.js and npm installed
- Expo CLI installed globally
- Gemini API key from Google AI Studio

### Environment Configuration
1. Create `.env.local` file with your Gemini API key:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

### Installation and Running
```bash
# Install dependencies
npm install

# Start development server
npm start

# Test options:
# - Press 'w' for web browser
# - Scan QR code with Expo Go app for mobile testing
# - Use --tunnel flag for network issues
```

## AI Question Generation

### Question Quality Framework
The app implements a comprehensive quality framework for AI-generated questions:

#### Research-Based Principles
- **Contextual Storytelling**: Questions include historical context and narratives
- **Engagement Over Facts**: Focus on memorable stories rather than dry statistics
- **Progressive Difficulty**: Balanced mix of easy, medium, and hard questions
- **Category Variety**: Diverse topics covering all aspects of cricket

#### Validation System
- **Structural Validation**: Ensures proper format and completeness
- **Content Quality Checks**: Validates engagement and educational value
- **Cricket Context Verification**: Confirms proper cricket terminology and context
- **Auto-Fix Capabilities**: Automatically corrects common formatting issues

### Example Question Generation
```typescript
const request: QuestionGenerationRequest = {
  category: 'legendary_moments',
  difficulty: 'medium',
  count: 2,
  includeExplanation: true
};

const questions = await geminiService.generateQuestions(request);
```

## Architecture Decisions

### Service Layer Pattern
- **GeminiService**: Encapsulates all AI interaction logic
- **QuestionValidator**: Separates validation concerns
- **Type Safety**: Comprehensive TypeScript interfaces

### Component Architecture
- **TriviaGame**: Main game logic and UI
- **Separation of Concerns**: Clear division between UI, business logic, and API calls
- **Error Handling**: Graceful fallbacks for API failures

### State Management
- **Local State**: React hooks for component-level state
- **Session Management**: Game progress and scoring
- **Question Generation**: Dynamic loading and caching

## Question Categories

1. **Legendary Moments**: Historic matches, iconic performances, memorable cricket moments
2. **Player Stories**: Career highlights, personal anecdotes, unique player stories
3. **Records & Stats**: Cricket records with compelling backstories and context
4. **Rules & Formats**: Game rules, formats, evolution of cricket
5. **Cultural Impact**: Cricket's influence on society, culture, and popular media

## Testing Strategy

### Development Testing
- **Live Reload**: Instant updates during development
- **Mobile Testing**: Real device testing via Expo Go
- **Web Testing**: Browser-based development testing

### Quality Assurance
- **Question Validation**: Automated quality checks for AI content
- **Error Handling**: Comprehensive error scenarios
- **Fallback Questions**: Sample questions for development and emergencies

## API Integration

### Gemini AI Configuration
```typescript
const geminiService = new GeminiService(apiKey);
const response = await geminiService.generateQuestions({
  category: 'legendary_moments',
  difficulty: 'medium',
  count: 5
});
```

### Environment Variables
- `EXPO_PUBLIC_GEMINI_API_KEY`: Google Gemini API key
- `EXPO_PUBLIC_DEBUG_MODE`: Enable debug logging
- `EXPO_PUBLIC_MAX_QUESTIONS_PER_SESSION`: Limit questions per session

## Development Workflow

1. **Setup**: Configure environment and install dependencies
2. **Development**: Use live reload for rapid iteration
3. **Testing**: Test on both web and mobile platforms
4. **Quality Check**: Validate AI question generation
5. **Deployment**: Build for production platforms

## Next Steps for Production

### User Experience
- [ ] Add user profiles and progress tracking
- [ ] Implement leaderboards and achievements
- [ ] Add question reporting and feedback system
- [ ] Create offline mode for downloaded questions

### Technical Enhancements
- [ ] Add question caching for offline play
- [ ] Implement analytics and usage tracking
- [ ] Add push notifications for daily challenges
- [ ] Create admin panel for question moderation

### Monetization Features
- [ ] Premium subscription for advanced features
- [ ] Ad integration between questions
- [ ] In-app purchases for question packs
- [ ] Tournament mode with entry fees

## Contributing

### Code Standards
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Include comprehensive documentation

### Question Quality
- Follow research-based trivia principles
- Ensure cricket accuracy and context
- Include engaging storytelling elements
- Provide educational explanations