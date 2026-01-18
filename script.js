// ===========================
// Rise Up AI Chatbot - Main Script
// ===========================

class RiseUpChatbot {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.settings = {
            darkMode: true,
            soundEffects: true,
            animations: true
        };
        this.ttsEnabled = false; // Default off, user can toggle
        this.synth = window.speechSynthesis;

        this.init();
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.breathingAudio = new BreathingAudio(this.audioCtx);
        }
        // Always try to resume context on user interaction
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.loadSettings();
        this.checkLoginStatus(); // Check if user is logged in
        this.updateMoodHistoryUI(); // Initial render of mood history
    }

    checkLoginStatus() {
        const username = localStorage.getItem('riseup-username');
        if (username) {
            this.showChat(username, false); // false means don't show welcome message again if just refreshing
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.querySelector('.app-container').style.display = 'none';

        const loginBtn = document.getElementById('login-btn');
        const usernameInput = document.getElementById('username-input');

        const handleLogin = () => {
            const name = usernameInput.value.trim();
            if (name) {
                localStorage.setItem('riseup-username', name);
                this.showChat(name, true); // true means show welcome message
            }
        };

        loginBtn.onclick = handleLogin;
        usernameInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleLogin();
        };
    }

    showChat(username, isNewLogin) {
        document.getElementById('login-screen').style.display = 'none';
        document.querySelector('.app-container').style.display = 'block'; // Or flex, depending on CSS

        // Ensure proper display style
        document.querySelector('.app-container').style.removeProperty('display');

        if (isNewLogin) {
            // Add personalized welcome message
            const welcomeMsg = `Hello ${username}! I'm Rise Up, your AI companion for emotional support and motivation. 🌟\n\nI'm here to listen, support you, and help you find your inner strength. How are you feeling today?`;

            // Clear previous empty welcome messages if any
            this.chatMessages.innerHTML = '';
            this.addMessage(welcomeMsg, 'bot');
            this.playSound('open');
        } else {
            // Just ensure elements are cached and listeners attached if not already
            this.loadHistory(); // Load history only if not new login to avoid duplicates or overwrites
            this.checkDailyAffirmation();
        }
        this.initializeSpeechRecognition();
    }

    cacheElements() {
        // Chat elements
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.quickActions = document.querySelectorAll('.quick-action-btn');

        // Voice
        this.voiceBtn = document.getElementById('voice-btn');

        this.breathingBtn = document.getElementById('breathing-btn');
        this.breathingModal = document.getElementById('breathing-modal');
        this.breathingSoundBtn = document.getElementById('breathing-sound-btn'); // New toggle
        this.closeBreathingModal = document.getElementById('close-breathing-modal');
        this.breathingCircle = document.querySelector('.breathing-circle');
        this.breathingText = document.querySelector('.breathing-text');

        // Modals
        this.moodModal = document.getElementById('mood-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.resourcesModal = document.getElementById('resources-modal');

        this.moodTrackerBtn = document.getElementById('mood-tracker-btn');
        this.ttsToggleBtn = document.getElementById('tts-toggle-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.getHelpBtn = document.getElementById('get-help-btn');

        this.closeMoodModal = document.getElementById('close-mood-modal');
        this.closeSettingsModal = document.getElementById('close-settings-modal');
        this.closeResourcesModal = document.getElementById('close-resources-modal');

        this.moodBtns = document.querySelectorAll('.mood-btn');

        // Settings
        this.themeToggle = document.getElementById('theme-toggle');
        this.soundToggle = document.getElementById('sound-toggle');
        this.animationsToggle = document.getElementById('animations-toggle');
    }

    attachEventListeners() {
        // Send message
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Quick actions
        this.quickActions.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.dataset.message;
                this.sendMessage(message);
            });
        });

        // Voice input
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());

        // Modals
        this.moodTrackerBtn.addEventListener('click', () => this.openModal(this.moodModal));
        this.ttsToggleBtn.addEventListener('click', () => this.toggleTTS());
        this.settingsBtn.addEventListener('click', () => this.openModal(this.settingsModal));
        this.closeMoodModal.addEventListener('click', () => this.closeModal(this.moodModal));
        this.closeSettingsModal.addEventListener('click', () => this.closeModal(this.settingsModal));

        // Breathing
        if (this.breathingBtn) {
            this.breathingBtn.addEventListener('click', () => this.startBreathing());
        }
        if (this.closeBreathingModal) {
            this.closeBreathingModal.addEventListener('click', () => this.stopBreathing());
        }
        if (this.breathingModal) {
            this.breathingModal.addEventListener('click', (e) => {
                if (e.target === this.breathingModal) {
                    this.stopBreathing();
                }
            });
        }
        if (this.breathingSoundBtn) {
            this.breathingSoundBtn.addEventListener('click', () => this.toggleBreathingSound());
        }

        // Resources
        if (this.getHelpBtn) {
            this.getHelpBtn.addEventListener('click', () => this.openModal(this.resourcesModal));
        }
        if (this.closeResourcesModal) {
            this.closeResourcesModal.addEventListener('click', () => this.closeModal(this.resourcesModal));
        }
        if (this.resourcesModal) {
            this.resourcesModal.addEventListener('click', (e) => {
                if (e.target === this.resourcesModal) {
                    this.closeModal(this.resourcesModal);
                }
            });
        }

        // Settings Actions
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear your conversation history?')) {
                    this.clearHistory();
                }
            });
        }

        // Close modal on backdrop click
        [this.moodModal, this.settingsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Mood tracking
        this.moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = btn.dataset.mood;
                this.handleMoodSelection(mood);
            });
        });

        // Settings
        this.themeToggle.addEventListener('change', () => this.toggleTheme());
        this.soundToggle.addEventListener('change', () => this.toggleSound());
        this.animationsToggle.addEventListener('change', () => this.toggleAnimations());
    }

    // ===========================
    // Message Handling
    // ===========================

    handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (message && !this.isTyping) {
            this.sendMessage(message);
            this.messageInput.value = '';
        }
    }

    async callGeminiAPI(userMessage, onStreamUpdate) {
        // Try to get API key from environment variable first, then fallback to hardcoded
        const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || 'AIzaSyCiFE21qnoTIj1ccR7nH5CKFk6-S8tHpYM';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`;

        // Construct history from recent messages (last 10)
        // Filter out empty messages and ensure all have valid text
        const historyContext = this.messages
            .slice(-10)
            .filter(msg => msg.text && msg.text.trim().length > 0)
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text.trim() }]
            }));

        // Create the system prompt
        const systemPrompt = `You are Rise Up, a compassionate and supportive AI companion. Your goal is to provide emotional support, motivation, and a listening ear. 
- You are NOT a therapist. If the user expresses self-harm or severe crisis, guide them to professional help immediately.
- Keep responses warm, empathetic, and concise (usually 2-3 sentences). 
- Use emojis to feel friendly.`;

        // Build contents array with system context
        const fullContents = [
            {
                role: 'user',
                parts: [{ text: systemPrompt }]
            },
            {
                role: 'model',
                parts: [{ text: "I understand. I'm Rise Up, your compassionate AI companion. I'm here to listen and support you. 💜" }]
            },
            ...historyContext,
            {
                role: 'user',
                parts: [{ text: userMessage }]
            }
        ];

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: fullContents,
                    generationConfig: {
                        temperature: 0.9,
                        topP: 0.95,
                        maxOutputTokens: 1024
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Gemini API Error Detail:", errorData);

                if (response.status === 403) {
                    throw new Error("API Key Invalid or Leaked. Please check your API key.");
                }
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            // Read the streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6); // Remove 'data: ' prefix
                            if (jsonStr.trim() === '') continue;

                            const data = JSON.parse(jsonStr);

                            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                                const newText = data.candidates[0].content.parts[0].text;
                                fullText = newText;

                                // Call the streaming update callback
                                if (onStreamUpdate) {
                                    onStreamUpdate(fullText);
                                }
                            }
                        } catch (parseError) {
                            // Skip invalid JSON chunks
                            continue;
                        }
                    }
                }
            }

            return fullText;
        } catch (error) {
            console.error('Gemini API Warning:', error);
            throw error;
        }
    }

    async sendMessage(text) {
        // Add user message
        this.addMessage(text, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Create a placeholder message for streaming
            let streamingMessageDiv = null;
            let isFirstChunk = true;

            // Try Gemini API with streaming
            const response = await this.callGeminiAPI(text, (streamedText) => {
                // Hide typing indicator on first chunk
                if (isFirstChunk) {
                    this.hideTypingIndicator();
                    isFirstChunk = false;

                    // Create the streaming message element
                    streamingMessageDiv = this.createStreamingMessage();
                }

                // Update the streaming message content
                if (streamingMessageDiv) {
                    const messageBubble = streamingMessageDiv.querySelector('.message-bubble p');
                    if (messageBubble) {
                        messageBubble.innerHTML = this.formatMessage(streamedText);
                    }
                    this.scrollToBottom();
                }
            });

            // Final update - save to history
            if (streamingMessageDiv) {
                // Remove the streaming message
                streamingMessageDiv.remove();
            }

            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
            this.speakResponse(response);
            this.playSound('message');
        } catch (error) {
            // Using offline mode (built-in emotional support responses)
            console.log("Falling back to offline mode:", error.message);
            setTimeout(() => {
                this.hideTypingIndicator();
                const response = this.generateMockResponse(text);
                this.addMessage(response, 'bot');
                this.speakResponse(response);
                this.playSound('message');
            }, 1000 + Math.random() * 1000);
        }
    }

    createStreamingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message streaming-message';

        const time = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-gradient"></div>
                <span class="avatar-emoji">✨</span>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <p></p>
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }


    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const time = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <div class="avatar-gradient"></div>
                    <span class="avatar-emoji">✨</span>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${this.formatMessage(text)}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar"></div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${this.escapeHtml(text)}</p>
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        this.messages.push({ text, sender, time });
        this.saveHistory();
    }

    showTypingIndicator() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-gradient"></div>
                <span class="avatar-emoji">✨</span>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingMessage = this.chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // ===========================
    // History Management
    // ===========================

    loadHistory() {
        const history = localStorage.getItem('riseup-history');
        if (history) {
            this.messages = JSON.parse(history);
            this.messages.forEach(msg => {
                this.renderMessage(msg.text, msg.sender, msg.time);
            });
        }
    }

    saveHistory() {
        localStorage.setItem('riseup-history', JSON.stringify(this.messages));
    }

    clearHistory() {
        this.messages = [];
        localStorage.removeItem('riseup-history');
        this.chatMessages.innerHTML = '';
        // Re-add welcome message
        this.addMessage("Hello! I'm Rise Up, your AI companion for emotional support and motivation. 🌟", 'bot');
        this.addMessage("I'm here to listen, support you, and help you find your inner strength. How are you feeling today?", 'bot');
        this.playSound('click');
    }

    // New helper to render without saving (to avoid duplicates when loading)
    renderMessage(text, sender, time) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        // Use provided time or current time
        const displayTime = time || new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        if (sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <div class="avatar-gradient"></div>
                    <span class="avatar-emoji">✨</span>
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${this.formatMessage(text)}</p>
                    </div>
                    <div class="message-time">${displayTime}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar"></div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p>${this.escapeHtml(text)}</p>
                    </div>
                    <div class="message-time">${displayTime}</div>
                </div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // ===========================
    // Daily Affirmations
    // ===========================

    checkDailyAffirmation() {
        const lastAffirmationDate = localStorage.getItem('riseup-last-affirmation-date');
        const today = new Date().toDateString();

        if (lastAffirmationDate !== today) {
            const affirmations = [
                "You are capable of amazing things.",
                "Every day is a fresh start.",
                "You are stronger than you think.",
                "Believe in yourself and all that you are.",
                "You are worthy of love and happiness.",
                "Your potential is limitless.",
                "Small steps led to big changes.",
                "You are in charge of your own happiness.",
                "Today is a gift, that's why it's called the present.",
                "You are enough, just as you are."
            ];
            const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];

            // Display affirmation in a modal or special message
            setTimeout(() => {
                this.addMessage(`🌟 **Daily Affirmation** 🌟\n\n"${randomAffirmation}"`, 'bot');
                localStorage.setItem('riseup-last-affirmation-date', today);
            }, 1000);
        }
    }

    // ===========================
    // AI Response Generation
    // ===========================

    generateMockResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();

        // Emotional support responses
        const responses = {
            sad: [
                "I hear you, and I want you to know that it's okay to feel sad. 💙 Your feelings are valid. Remember, even the darkest nights end with a beautiful sunrise. What's weighing on your heart right now?",
                "I'm here with you. 🌟 Sadness is a natural part of being human, and it shows that you care deeply. Would you like to talk about what's making you feel this way?",
                "Thank you for sharing how you're feeling. 💜 It takes courage to acknowledge sadness. Remember, this feeling is temporary, and brighter days are ahead. How can I support you right now?"
            ],
            stressed: [
                "I can sense you're feeling overwhelmed. 🌊 Let's take a deep breath together. Remember: you don't have to carry everything at once. What's the biggest source of stress for you right now?",
                "Stress can feel heavy, but you're stronger than you know. 💪 Let's break things down into smaller, manageable pieces. What's one thing we can tackle together?",
                "I'm here to help you find calm in the chaos. 🧘‍♀️ Sometimes, the best thing we can do is pause and breathe. What would help you feel more at ease right now?"
            ],
            anxious: [
                "Anxiety can feel overwhelming, but you're not alone in this. 🤝 Let's ground ourselves in the present moment. Can you name 5 things you can see around you right now?",
                "I understand that anxiety can make everything feel uncertain. 🌈 But remember: you've overcome challenges before, and you can do it again. What's making you feel anxious?",
                "Your feelings are valid, and it's okay to feel anxious. 💚 Let's work through this together. What would help you feel more secure right now?"
            ],
            motivation: [
                "You've got this! 🚀 Every great achievement starts with the decision to try. What goal are you working towards? Let's break it down together!",
                "I believe in you! 💫 Remember, progress isn't always linear, but every step forward counts. What's one small action you can take today?",
                "Your potential is limitless! 🌟 The fact that you're here seeking motivation shows your commitment to growth. What dream are you chasing?"
            ],
            happy: [
                "That's wonderful! 🎉 Your joy is contagious! What's bringing you happiness today? I'd love to celebrate with you!",
                "I'm so glad to hear that! 😊 Happiness looks beautiful on you. What's making your day special?",
                "Amazing! 🌈 Keep riding that positive wave! What's putting that smile on your face?"
            ],
            grateful: [
                "Gratitude is such a powerful emotion! 🙏 It's beautiful that you're taking time to appreciate the good things. What are you grateful for today?",
                "That's wonderful! 💖 Practicing gratitude can transform our perspective. What blessings are you counting today?",
                "I love your positive mindset! ✨ Gratitude opens the door to more abundance. What's filling your heart with thankfulness?"
            ],
            lonely: [
                "I'm here with you, and you're not alone. 🤗 Loneliness can be difficult, but remember that connection is always possible. Would you like to talk about what you're feeling?",
                "Thank you for reaching out. 💙 Even in moments of loneliness, you have the strength within you. I'm here to listen and support you.",
                "You're never truly alone. 🌟 I'm here, and there are people who care about you. What would help you feel more connected right now?"
            ],
            default: [
                "I'm here to listen and support you. 💜 Tell me more about what's on your mind. Your thoughts and feelings matter.",
                "Thank you for sharing with me. 🌟 I'm here to help you navigate whatever you're going through. What would be most helpful for you right now?",
                "I appreciate you opening up. 💙 Remember, every challenge is an opportunity for growth. How can I best support you today?",
                "You're taking a positive step by reaching out. ✨ I'm here to walk alongside you. What's the most important thing you'd like to talk about?"
            ]
        };

        // Determine response category
        let category = 'default';
        if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
            category = 'sad';
        } else if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm') || lowerMessage.includes('pressure')) {
            category = 'stressed';
        } else if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried') || lowerMessage.includes('nervous')) {
            category = 'anxious';
        } else if (lowerMessage.includes('motivat') || lowerMessage.includes('inspire') || lowerMessage.includes('goal')) {
            category = 'motivation';
        } else if (lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('amazing') || lowerMessage.includes('wonderful')) {
            category = 'happy';
        } else if (lowerMessage.includes('grateful') || lowerMessage.includes('thankful') || lowerMessage.includes('blessed')) {
            category = 'grateful';
        } else if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
            category = 'lonely';
        }

        // Get random response from category
        const categoryResponses = responses[category];
        const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

        return response;
    }

    // ===========================
    // Mood History Helper
    // ===========================
    saveMood(mood) {
        const history = JSON.parse(localStorage.getItem('riseup-mood-history') || '[]');
        history.push({
            mood,
            date: new Date().toISOString()
        });
        // Keep last 10 entries
        if (history.length > 10) history.shift();
        localStorage.setItem('riseup-mood-history', JSON.stringify(history));
        this.updateMoodHistoryUI();
    }

    updateMoodHistoryUI() {
        const historyList = document.getElementById('mood-history-list');
        if (!historyList) return;

        const history = JSON.parse(localStorage.getItem('riseup-mood-history') || '[]');

        if (history.length === 0) {
            historyList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.9rem;">No mood history yet.</span>';
            return;
        }

        const moodEmojis = {
            amazing: '🤩', happy: '😊', okay: '😐', sad: '😔', anxious: '😰'
        };

        historyList.innerHTML = history.reverse().map(entry => `
            <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; min-width: 60px;">
                <span style="font-size: 1.5rem;">${moodEmojis[entry.mood] || '❓'}</span>
                <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
            </div>
        `).join('');
    }




    formatMessage(text) {
        // First escape HTML to prevent XSS
        let formatted = this.escapeHtml(text);

        // Handle markdown formatting
        // Bold: **text** -> <strong>text</strong>
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic: *text* -> <em>text</em> (but not if it's part of **)
        formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===========================
    // Voice Recognition
    // ===========================

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.voiceBtn.classList.remove('recording');
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.voiceBtn.classList.remove('recording');
            };

            this.recognition.onend = () => {
                this.voiceBtn.classList.remove('recording');
            };
        } else {
            this.voiceBtn.style.display = 'none';
        }
    }

    toggleVoiceRecognition() {
        if (!this.recognition) return;

        if (this.voiceBtn.classList.contains('recording')) {
            this.recognition.stop();
            this.voiceBtn.classList.remove('recording');
        } else {
            this.recognition.start();
            this.voiceBtn.classList.add('recording');
            this.playSound('start');
        }
    }

    // ===========================
    // Breathing Exercise
    // ===========================

    startBreathing() {
        this.openModal(this.breathingModal);
        this.initAudio(); // Ensure audio context is ready
        this.breathingAudio.start();

        // Update button UI to active state since sound is on by default
        if (this.breathingSoundBtn) {
            this.breathingSoundBtn.classList.add('active');
            const icon = this.breathingSoundBtn.querySelector('svg');
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
        }

        const runCycle = () => {
            // Inhale - 4s
            this.breathingText.textContent = "Inhale";
            this.breathingCircle.className = 'breathing-circle inhale';
            this.breathingAudio.rampTo('inhale');

            setTimeout(() => {
                // Hold - 4s
                if (!this.breathingModal.classList.contains('active')) return;
                this.breathingText.textContent = "Hold";
                this.breathingCircle.className = 'breathing-circle hold';
                this.breathingAudio.rampTo('hold');

                setTimeout(() => {
                    // Exhale - 4s
                    if (!this.breathingModal.classList.contains('active')) return;
                    this.breathingText.textContent = "Exhale";
                    this.breathingCircle.className = 'breathing-circle exhale';
                    this.breathingAudio.rampTo('exhale');
                }, 4000);
            }, 4000);
        };

        runCycle();
        this.breathingInterval = setInterval(runCycle, 12000); // 4+4+4 = 12s cycle
    }

    stopBreathing() {
        this.closeModal(this.breathingModal);
        clearInterval(this.breathingInterval);
        this.breathingCircle.className = 'breathing-circle';
        this.breathingText.textContent = "Inhale";
        if (this.breathingAudio) {
            this.breathingAudio.stop();
        }
    }

    toggleBreathingSound() {
        if (!this.breathingAudio) return;

        // Ensure context is running when toggling
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const isMuted = this.breathingAudio.toggleMute();
        const icon = this.breathingSoundBtn.querySelector('svg');
        if (isMuted) {
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
            this.breathingSoundBtn.classList.remove('active');
        } else {
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
            this.breathingSoundBtn.classList.add('active');
        }
    }

    // ===========================
    // Mood Tracking
    // ===========================

    handleMoodSelection(mood) {
        const moodMessages = {
            amazing: "That's fantastic! 🤩 I'm so happy you're feeling amazing! What's making today so special?",
            happy: "Wonderful! 😊 It's great to see you in good spirits! What's bringing you joy?",
            okay: "I hear you. 😐 Some days are just okay, and that's perfectly fine. Want to talk about anything?",
            sad: "I'm here for you. 😔 It's okay to feel sad. Would you like to share what's on your mind?",
            anxious: "I understand. 😰 Anxiety can be tough. Let's work through this together. What's worrying you?"
        };

        const response = moodMessages[mood];
        this.closeModal(this.moodModal);
        this.saveMood(mood);

        setTimeout(() => {
            this.addMessage(response, 'bot');
            this.speakResponse(response);
            this.playSound('message');
        }, 300);
    }

    // ===========================
    // Text-to-Speech
    // ===========================

    toggleTTS() {
        this.ttsEnabled = !this.ttsEnabled;
        const icon = this.ttsToggleBtn.querySelector('svg');

        if (this.ttsEnabled) {
            this.ttsToggleBtn.classList.add('active');
            // Show volume up icon
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
            this.playSound('click');
        } else {
            this.ttsToggleBtn.classList.remove('active');
            this.synth.cancel(); // Stop speaking immediately
            // Show volume off icon
            icon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
        }
    }

    speakResponse(text) {
        if (!this.ttsEnabled) return;

        // Clean text (remove formatting like **bold**)
        const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to select a better voice
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(voice => voice.name.includes('Google US English') || voice.name.includes('Female'));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        this.synth.speak(utterance);
    }

    // ===========================
    // Modal Management
    // ===========================

    openModal(modal) {
        modal.classList.add('active');
        this.playSound('open');
    }

    closeModal(modal) {
        modal.classList.remove('active');
    }

    // ===========================
    // Settings
    // ===========================

    loadSettings() {
        const savedSettings = localStorage.getItem('riseup-settings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
            this.applySettings();
        }
    }

    saveSettings() {
        localStorage.setItem('riseup-settings', JSON.stringify(this.settings));
    }

    applySettings() {
        this.themeToggle.checked = this.settings.darkMode;
        this.soundToggle.checked = this.settings.soundEffects;
        this.animationsToggle.checked = this.settings.animations;

        if (!this.settings.darkMode) {
            document.body.classList.add('light-theme');
        }

        if (!this.settings.animations) {
            document.body.style.setProperty('--transition-fast', '0ms');
            document.body.style.setProperty('--transition-base', '0ms');
            document.body.style.setProperty('--transition-slow', '0ms');
        }
    }

    toggleTheme() {
        this.settings.darkMode = this.themeToggle.checked;
        document.body.classList.toggle('light-theme', !this.settings.darkMode);
        this.saveSettings();
        this.playSound('click');
    }

    toggleSound() {
        this.settings.soundEffects = this.soundToggle.checked;
        this.saveSettings();
    }

    toggleAnimations() {
        this.settings.animations = this.animationsToggle.checked;
        if (this.settings.animations) {
            document.body.style.removeProperty('--transition-fast');
            document.body.style.removeProperty('--transition-base');
            document.body.style.removeProperty('--transition-slow');
        } else {
            document.body.style.setProperty('--transition-fast', '0ms');
            document.body.style.setProperty('--transition-base', '0ms');
            document.body.style.setProperty('--transition-slow', '0ms');
        }
        this.saveSettings();
        this.playSound('click');
    }

    // ===========================
    // Sound Effects
    // ===========================

    playSound(type) {
        if (!this.settings.soundEffects) return;

        // Using Web Audio API for simple sound effects
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const sounds = {
            message: { frequency: 800, duration: 0.1 },
            click: { frequency: 600, duration: 0.05 },
            open: { frequency: 700, duration: 0.1 },
            start: { frequency: 900, duration: 0.15 }
        };

        const sound = sounds[type] || sounds.click;

        oscillator.frequency.value = sound.frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + sound.duration);
    }
}

// Initialize the chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.riseUpBot = new RiseUpChatbot();
});

class BreathingAudio {
    constructor(audioCtx) {
        this.ctx = audioCtx;
        this.masterGain = null;
        this.oscillators = [];
        this.isMuted = false; // Enable by default so user can hear it immediately
        this.isPlaying = false;
    }

    setup() {
        if (this.masterGain) return;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Lower, warmer frequencies (Deep C Major 7th Chord)
        // C2=65.41, G2=98.00, B2=123.47, E3=164.81
        const freqs = [65.41, 98.00, 123.47, 164.81];

        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            // Individual gain for balance
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime); // Increased volume slightly

            // Lowpass filter to soften the sound (remove harshness)
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, this.ctx.currentTime);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            this.oscillators.push({ osc, gain, filter });
        });
    }

    start() {
        this.setup();
        this.isPlaying = true;
        if (!this.isMuted) {
            this.fadeIn();
        }
    }

    stop() {
        if (!this.masterGain) return;

        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Slower fade out

        this.isPlaying = false;

        setTimeout(() => {
            if (!this.isPlaying) {
                this.oscillators.forEach(o => {
                    o.osc.stop();
                    o.osc.disconnect();
                });
                this.oscillators = [];
                this.masterGain.disconnect();
                this.masterGain = null;
            }
        }, 1600);
    }

    fadeIn() {
        if (!this.masterGain) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0.001, now);
        this.masterGain.gain.linearRampToValueAtTime(0.2, now + 3); // Slow gentle fade in
    }

    rampTo(state) {
        if (!this.masterGain || this.isMuted) return;

        const now = this.ctx.currentTime;
        // Cancel previous ramps to prevent conflict
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);

        // Sync with 4s timing
        if (state === 'inhale') {
            // Swell volume gently (Inhale = Rising energy)
            this.masterGain.gain.linearRampToValueAtTime(0.3, now + 3.8);

            // Subtle filter opening
            this.oscillators.forEach(o => {
                o.filter.frequency.linearRampToValueAtTime(600, now + 3.8);
            });

        } else if (state === 'hold') {
            // Sustain (Hold = Stability)
            // Slight dip then hold steady
            this.masterGain.gain.linearRampToValueAtTime(0.28, now + 3.8);

        } else if (state === 'exhale') {
            // Decrease volume gently (Exhale = Release)
            this.masterGain.gain.linearRampToValueAtTime(0.05, now + 3.8);

            // Close filter
            this.oscillators.forEach(o => {
                o.filter.frequency.linearRampToValueAtTime(200, now + 3.8);
            });
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            if (this.isMuted) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
            } else {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.5);
            }
        }
        return this.isMuted;
    }
}

