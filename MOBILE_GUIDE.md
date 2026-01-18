# Mobile Troubleshooting Guide

## The app works on your phone! 📱

Your Rise Up chatbot should work perfectly on mobile devices. Here's what you need to know:

## How It Works

### With Internet Connection

- The app tries to use Google's Gemini AI for intelligent responses
- Provides personalized, contextual emotional support

### Without API or Offline

- **Automatically falls back** to built-in emotional support responses
- Still provides meaningful, empathetic replies
- All features remain functional (mood tracking, breathing exercises, etc.)

## Why You Might See Different Responses

If you're getting the built-in responses instead of AI responses on mobile, it could be due to:

1. **API Key Issues**

   - The free Gemini API key might have rate limits
   - Network restrictions on mobile data

2. **Network Issues**

   - Mobile network might block certain API calls
   - CORS restrictions on some networks

3. **Browser Compatibility**
   - Some mobile browsers handle API calls differently
   - Try Chrome or Safari on mobile for best results

## Testing on Your Phone

### Access Your Local Server

1. Make sure your phone and computer are on the **same WiFi network**
2. Use the Network URL shown when you run `npm run dev`
3. For example: `http://10.80.37.152:5173/`
4. Open this URL in your phone's browser

### Testing on Vercel (Production)

1. Deploy to Vercel using the button in README
2. Add your `VITE_GEMINI_API_KEY` in Vercel dashboard
3. Access the deployed URL from any device

## What's Working

Even without the AI API, your phone gets:

- ✅ Full UI and design
- ✅ Mood tracking
- ✅ Breathing exercises
- ✅ Quick action buttons
- ✅ Settings (dark mode, etc.)
- ✅ Voice input (on supported browsers)
- ✅ Intelligent offline responses based on keywords

## Built-in Response Categories

The offline mode includes responses for:

- 😔 Sadness & Depression
- 😰 Stress & Overwhelm
- 😨 Anxiety & Worry
- 💪 Motivation & Goals
- 😊 Happiness & Joy
- 🙏 Gratitude
- 😢 Loneliness
- 💬 General support

## Recommended Browsers

**Best Mobile Experience:**

- Chrome (Android)
- Safari (iOS)
- Edge (Android)

**Voice Input Support:**

- Chrome (full support)
- Safari (limited)
- Firefox (varies)

## Checking If API Is Working

Look at the console in your browser's dev tools:

- If you see "Falling back to offline mode" → Using built-in responses
- No error message → API is working

## Need Help?

The app is designed to work beautifully on mobile regardless of API status. Enjoy your emotional support companion! 💜
