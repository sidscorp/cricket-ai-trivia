# 🧪 Fresh Installation Test

This document provides step-by-step instructions to test the Cricket AI Trivia repository from a completely fresh installation.

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **Git** (for cloning the repository)

## 🚀 Fresh Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/sidscorp/cricket-ai-trivia.git
cd cricket-ai-trivia
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your API keys
# You need:
# - EXPO_PUBLIC_GEMINI_API_KEY (from Google AI Studio)
# - GOOGLE_CUSTOM_SEARCH_API_KEY (from Google Cloud Console)  
# - GOOGLE_CUSTOM_SEARCH_ENGINE_ID (from Google Programmable Search Engine)
```

## 🔑 API Keys Setup Guide

### Gemini AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add to `.env` as `EXPO_PUBLIC_GEMINI_API_KEY`

### Google Custom Search API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Custom Search JSON API"
3. Create credentials (API Key)
4. Add to `.env` as `GOOGLE_CUSTOM_SEARCH_API_KEY`

### Google Custom Search Engine
1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Create a new search engine
3. Configure to search cricket websites (espncricinfo.com, cricbuzz.com, etc.)
4. Get the Search Engine ID and add to `.env` as `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

## ✅ Testing Commands

### Test 1: CLI Help (Should work immediately)
```bash
npm run cli:help
```
**Expected**: Shows list of 4 commands (search-generate, verify, search, performance)

### Test 2: Search API (Tests Google Custom Search)
```bash
npm run cli:search -- --query "cricket legends"
```
**Expected**: Returns 10 cricket-related search results

### Test 3: Fact Verification (Tests both APIs)
```bash
npm run cli:verify -- --incident "Virat Kohli scored 183 runs against Pakistan in 2012 Asia Cup"
```
**Expected**: Verifies the fact with confidence score and sources

### Test 4: Main Question Generation (Full pipeline test)
```bash
npm run cli:questions -- --questions 3
```
**Expected**: Generates exactly 3 high-quality cricket trivia questions with sources

### Test 5: Mobile App (React Native)
```bash
npm start
```
**Expected**: Starts Expo development server for mobile app testing

## 🎯 Success Criteria

✅ **CLI Commands Work**: All 4 CLI commands execute without errors  
✅ **API Integration**: Both Gemini and Google Search APIs respond correctly  
✅ **Question Generation**: Produces factual questions with proper sources  
✅ **Mobile App**: Expo development server starts successfully  

## 🐛 Common Issues

### "Module not found" errors
- Run `npm install` again
- Check Node.js version (should be v18+)

### "API key not found" errors  
- Verify `.env` file exists and has correct keys
- Check API key formats (no extra spaces/quotes)

### "Cannot find command" errors
- Use `npm run cli:help` instead of `npm run cli help`
- Check package.json scripts are updated

### Search API errors
- Verify Google Custom Search Engine is configured
- Check API quotas in Google Cloud Console

## 📊 Performance Expectations

- **Question Generation**: 3-8 seconds for 3 questions
- **Fact Verification**: 1-3 seconds per fact
- **Search API**: Under 1 second response time
- **Mobile App Startup**: 10-30 seconds for Expo dev server

## 🎉 Fresh Install Complete!

If all tests pass, the repository is working correctly from a fresh installation. You now have:

- ✅ Working CLI with 4 core commands
- ✅ AI question generation pipeline  
- ✅ Web fact verification system
- ✅ Mobile trivia game foundation
- ✅ Complete development environment

Ready to build amazing cricket trivia experiences! 🏏