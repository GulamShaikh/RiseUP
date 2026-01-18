
async function testGemini() {
    const API_KEY = 'AIzaSyCiFE21qnoTIj1ccR7nH5CKFk6-S8tHpYM';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    console.log('Testing Gemini 2.5 Flash...');
    console.log('Time:', new Date().toISOString());

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say hello in one sentence!" }] }]
            })
        });

        console.log("Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.log("Error Response:", errorText);
        } else {
            const data = await response.json();
            console.log("✅ SUCCESS! API is working");
            console.log("AI Response:", data.candidates[0].content.parts[0].text);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testGemini();
