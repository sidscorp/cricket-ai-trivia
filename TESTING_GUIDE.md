# Cricket Trivia App - Testing Guide

## Quick Start (Web Browser)
1. Open terminal in your cricket-trivia project folder
2. Run: `npm start`
3. Wait for server to start (shows "Metro waiting...")
4. Press `w` key in terminal
5. Your browser opens with the cricket trivia app

## Testing on Your Phone (Recommended)

### Step 1: Install Expo Go App
- **iPhone**: Go to App Store → Search "Expo Go" → Install
- **Android**: Go to Google Play Store → Search "Expo Go" → Install

### Step 2: Start Development Server
```bash
cd cricket-trivia
npm start
```

### Step 3: Connect Your Phone
- **iPhone**: Open Camera app → Point at QR code in terminal → Tap notification
- **Android**: Open Expo Go app → Tap "Scan QR Code" → Scan QR code in terminal

### Step 4: See Your App
- App loads automatically on your phone
- Any code changes update instantly (live reload)

## Alternative Testing Methods

### Web Browser (Fastest)
1. Start server: `npm start`
2. Press `w` in terminal
3. App opens in browser

### iOS Simulator (Mac only)
1. Start server: `npm start`
2. Press `i` in terminal
3. iOS simulator opens with app

### Android Emulator
1. Install Android Studio with emulator
2. Start server: `npm start`
3. Press `a` in terminal
4. Android emulator opens with app

## Troubleshooting

### Server Won't Start
```bash
# Kill any existing processes
npx expo install --fix
npm start
```

### Can't See QR Code
- Press `m` in terminal to toggle menu
- Or press `w` to test in browser first

### Phone Can't Connect
- Make sure phone and computer on same WiFi
- Check firewall isn't blocking port 8081

## What You Should See
- Green cricket-themed app
- "🏏 Cricket Trivia" title
- "Start Game" button (white)
- "Practice Mode" button (outlined)

## Making Changes
- Edit any file in the project
- Save the file
- App updates instantly on all connected devices
- No need to restart or rebuild