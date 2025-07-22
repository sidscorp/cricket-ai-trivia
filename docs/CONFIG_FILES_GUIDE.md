# 📋 Configuration Files Guide

This guide explains every configuration file in the Cricket Trivia project, what it does, and when you might need to modify it.

## 🔧 Core Configuration Files

### 1. **package.json**
**Purpose**: Defines project metadata, dependencies, and scripts

```json
{
  "name": "cricket-trivia",
  "version": "1.0.0",
  "type": "module",      // ES6 module support
  "main": "index.ts",    // Entry point for Expo
  "scripts": {
    // Mobile app commands
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    
    // CLI commands
    "cli": "node cli/index.js",
    "cli:questions": "node cli/index.js search-generate",
    "cli:learn": "node cli/index.js learn-cricket",
    // ... more CLI shortcuts
  }
}
```

**When to modify**:
- Adding new dependencies: `npm install package-name`
- Adding new CLI commands or shortcuts
- Updating project version

### 2. **tsconfig.json**
**Purpose**: TypeScript compiler configuration

```json
{
  "compilerOptions": {
    "jsx": "react-native",           // For React Native JSX
    "target": "esnext",              // Latest JavaScript features
    "module": "commonjs",            // Module system
    "strict": true,                  // Strict type checking
    "esModuleInterop": true,         // ES module compatibility
    "skipLibCheck": true,            // Skip type checking of dependencies
    "allowJs": true,                 // Allow JavaScript files
    "resolveJsonModule": true        // Import JSON files
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "shared/**/*.d.ts"               // Include type declarations
  ]
}
```

**When to modify**:
- Changing TypeScript strictness settings
- Adding new file patterns to include/exclude
- Adjusting module resolution strategy

### 3. **.env.example**
**Purpose**: Template for environment variables

```env
# OpenRouter API Key for all AI features
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Google Custom Search API (optional, for verification)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_CUSTOM_SEARCH_CX=your_google_search_engine_id_here
```

**When to modify**:
- Adding new API services
- Changing environment variable names
- Adding configuration options

**Note**: Create `.env` from this template and add your actual API keys

### 4. **app.json**
**Purpose**: Expo/React Native app configuration

```json
{
  "expo": {
    "name": "Cricket Trivia",
    "slug": "cricket-trivia",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.crickettrivia"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a472a"
      },
      "package": "com.yourcompany.crickettrivia"
    }
  }
}
```

**When to modify**:
- Changing app name or version
- Updating app icons or splash screen
- Configuring platform-specific settings
- Setting up app store metadata

### 5. **metro.config.cjs**
**Purpose**: React Native bundler configuration

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .cjs extension support
config.resolver.sourceExts.push('cjs');

module.exports = config;
```

**When to modify**:
- Adding custom file extensions
- Configuring asset resolution
- Setting up module aliases

### 6. **.gitignore**
**Purpose**: Specifies files Git should ignore

```gitignore
# Dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Environment files
.env
.env.local

# OS files
.DS_Store
*.log

# IDE
.vscode/
.idea/
```

**When to modify**:
- Adding new build output directories
- Excluding new IDE configuration files
- Adding temporary file patterns

## 📁 CLI-Specific Configuration

### 7. **cli/utils/config.js**
**Purpose**: Centralized configuration for CLI tools

```javascript
export const config = {
  openRouter: {
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'anthropic/claude-3-sonnet'
  },
  googleSearch: {
    apiKey: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
    searchEngineId: process.env.GOOGLE_CUSTOM_SEARCH_CX,
    maxResults: 5
  },
  performance: {
    targetTime: 4000,  // 4 seconds
    maxRetries: 3
  }
};
```

**When to modify**:
- Changing default models or API endpoints
- Adjusting performance targets
- Adding new service configurations

## 🎨 Asset Configuration

### 8. **assets/** Directory Structure
```
assets/
├── adaptive-icon.png    # Android adaptive icon (1024x1024)
├── favicon.png          # Web favicon (48x48)
├── icon.png            # Main app icon (1024x1024)
├── splash-icon.png     # Splash screen icon (512x512)
└── branding/
    └── mascot_cat_with_bat.png  # App mascot
```

**When to modify**:
- Updating app branding
- Changing icon designs
- Adding new image assets

## 🧪 Testing Configuration

### 9. **package.json - Test Scripts**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**When to modify**:
- Adding test runners
- Configuring test environments
- Setting up CI/CD pipelines

## 🔍 Environment Variables Reference

### Required Variables
- `EXPO_PUBLIC_OPENROUTER_API_KEY`: OpenRouter API access (required for all AI features)

### Optional Variables
- `GOOGLE_CUSTOM_SEARCH_API_KEY`: Google Custom Search API (for verification features)
- `GOOGLE_CUSTOM_SEARCH_CX`: Google Custom Search Engine ID
- `NODE_ENV`: Environment (development/production)

### Variable Naming Convention
- `EXPO_PUBLIC_*`: Variables accessible in React Native app
- Other variables: Only accessible in Node.js/CLI environment

## 📝 Configuration Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Keep secrets in environment variables** - Not in code
3. **Use type-safe config objects** - Define interfaces for config
4. **Centralize configuration** - Avoid scattered config values
5. **Document all options** - Help future developers

## 🚀 Quick Setup Checklist

1. ✅ Copy `.env.example` to `.env`
2. ✅ Add your OpenRouter API key
3. ✅ (Optional) Add Google Search credentials
4. ✅ Run `npm install` to install dependencies
5. ✅ Run `npm start` for mobile app or `npm run cli` for CLI

## 🛠️ Troubleshooting Config Issues

### API Key Not Working
- Check `.env` file exists and has correct values
- Ensure variable names match exactly (case-sensitive)
- Restart the development server after changing `.env`

### TypeScript Errors
- Run `npx tsc --noEmit` to check for type errors
- Ensure `tsconfig.json` includes all source files
- Check that `.d.ts` files are in included paths

### Metro Bundler Issues
- Clear cache: `npx expo start -c`
- Check `metro.config.cjs` for syntax errors
- Ensure all file extensions are registered