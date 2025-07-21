#!/bin/bash

# Test script to demonstrate model switching via environment variables

echo "🏏 Testing Learn Cricket with different AI models"
echo "================================================"

echo -e "\n1. Testing with default model (GPT-3.5 Turbo)..."
echo "   Command: npm run cli:learn-fast -- --mode fast"
npm run cli:learn-fast -- --mode fast 2>&1 | grep -E "(Using model:|Generated in)"

echo -e "\n2. Testing with Perplexity Sonar (quality mode)..."
echo "   Command: LEARN_CRICKET_MODEL=quality npm run cli:learn-fast -- --mode original"
LEARN_CRICKET_MODEL=quality npm run cli:learn-fast -- --mode original 2>&1 | grep -E "(Using model:|Generated in)"

echo -e "\n3. Testing with free model (Llama 3.1)..."
echo "   Command: LEARN_CRICKET_MODEL=free npm run cli:learn-fast -- --mode fast"
LEARN_CRICKET_MODEL=free npm run cli:learn-fast -- --mode fast 2>&1 | grep -E "(Using model:|Generated in)"

echo -e "\n✅ Model switching test complete!"
echo "You can use LEARN_CRICKET_MODEL environment variable to switch models in both CLI and UI"