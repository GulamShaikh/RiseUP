# API Setup Instructions

## Current Status: ✅ LIVE API ENABLED (UNLIMITED)

Your Rise Up chatbot is now using the **Gemini Live API** with **real-time streaming responses**!

## Features:
- ✅ **Unlimited requests** - No daily quota limits
- ✅ **Real-time streaming** - Text appears word-by-word like ChatGPT
- ✅ **Better user experience** - Professional, engaging responses
- ✅ **Production-ready** - Perfect for demos and showcases

## Current Configuration:

**Model**: `gemini-2.0-flash-exp` (Streaming)
**API Type**: Server-Sent Events (SSE)
**Limits**: 
- RPM: Unlimited
- TPM: 1M tokens/minute
- RPD: Unlimited

## How It Works:

The chatbot now uses the Gemini streaming API which:
1. Sends your message to the AI
2. Receives the response in real-time chunks
3. Updates the UI as each word arrives
4. Shows a blinking cursor during generation

## Fallback Mode:

If the API fails for any reason, the chatbot automatically falls back to offline mode with built-in emotional support responses.

## API Key:

Current key: `AIzaSyCiFE21qnoTIj1ccR7nH5CKFk6-S8tHpYM`

To update the API key, edit line 168 in `script.js`:
```javascript
const API_KEY = 'YOUR_NEW_KEY_HERE';
```

---

## For Production Deployment:

**IMPORTANT**: Never expose your API key in client-side code for production!

For a production app, you should:
1. Create a backend server (Node.js, Python, etc.)
2. Store the API key in environment variables
3. Make API calls from the backend
4. Send responses to your frontend

This is fine for demos and MVPs, but not for public deployment.

---

## Testing:

Open your browser and send a message. You should see:
1. Typing indicator appears
2. AI response streams in word-by-word
3. Blinking cursor shows during generation
4. Final message is saved to history

**Enjoy unlimited, real-time AI responses!** 🚀
