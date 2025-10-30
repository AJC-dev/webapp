// api/generate.js
// This is our secure Vercel Serverless Function.
// It runs on the server, so it can safely use our secret API key.

export default async function handler(request, response) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userQuery, systemPrompt } = request.body;

    // Get the secret API key from Vercel's environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API key not configured.' });
    }

    if (!userQuery || !systemPrompt) {
        return response.status(400).json({ error: 'Missing userQuery or systemPrompt.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            maxOutputTokens: 100
        }
    };

    try {
        // Server-to-server call to Google
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('Gemini API Error:', errorBody);
            throw new Error(`Gemini API error! status: ${geminiResponse.status}`);
        }

        const result = await geminiResponse.json();

        if (result.candidates && result.candidates[0].content?.parts?.[0]?.text) {
            const text = result.candidates[0].content.parts[0].text.trim();
            // Send the generated text back to our client
            return response.status(200).json({ text: text });
        } else {
            throw new Error("Invalid response structure from API.");
        }

    } catch (error) {
        console.error("Error in serverless function:", error);
        return response.status(500).json({ error: 'Failed to generate message.' });
    }
}
