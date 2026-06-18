const axios = require('axios');

const { createHistoryEntry, getHistoryByUserId } = require('../utils/storage');
const { generateLocalEmail } = require('../utils/localAiGenerator');

const buildGroqPrompt = (prompt) => `You are an expert job outreach strategist.

Your task is to generate a high-converting cold email to a recruiter for a job opportunity.

Important:
- Even if the user gives only 2-4 words, assume realistic context.
- Do not ask for clarification.
- Make professional assumptions.
- Avoid generic phrases.
- Keep it concise and structured.

Return only valid JSON:
{
  "subject": "",
  "emailBody": "",
  "linkedInDM": "",
  "followUpEmail": ""
}

Rules:
- Subject: 6-9 words, confident, value-focused
- Email body: 60-90 words, professional, specific, clear CTA
- LinkedIn DM: 30-50 words
- Follow-up email: 50-80 words

User request: "${prompt}"`;

const generateWithGroq = async (prompt, groqApiKey) => {
    const aiResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'user',
                    content: buildGroqPrompt(prompt)
                }
            ],
            temperature: 0.7,
            max_tokens: 1024
        },
        {
            headers: {
                Authorization: `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    );

    if (!aiResponse.data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Groq API');
    }

    const generatedText = aiResponse.data.choices[0].message.content;
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

    let parsedResponse;
    try {
        parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(generatedText);
    } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Generated text:', generatedText);
        throw new Error('The AI generated invalid JSON. Please try again.');
    }

    return {
        subject: parsedResponse.subject || 'New Opportunity',
        emailBody: parsedResponse.emailBody || '',
        linkedInDM: parsedResponse.linkedInDM || '',
        followUpEmail: parsedResponse.followUpEmail || '',
        generationMode: 'groq'
    };
};

exports.generateEmail = async (req, res) => {
    try {
        const rawPrompt = req.body?.prompt
            ?? req.body?.context
            ?? req.body?.content
            ?? req.body?.message;

        if (typeof rawPrompt === 'undefined' || rawPrompt === null) {
            return res.status(400).json({
                message: 'Prompt is required. Send it as `prompt` in the request body.'
            });
        }

        if (typeof rawPrompt !== 'string') {
            return res.status(400).json({ message: 'Prompt must be a string' });
        }

        const cleanedPrompt = rawPrompt.trim();

        if (cleanedPrompt.length === 0) {
            return res.status(400).json({ message: 'Prompt cannot be empty' });
        }

        if (cleanedPrompt.length > 2000) {
            return res.status(400).json({ message: 'Prompt cannot exceed 2000 characters' });
        }
        const groqApiKey = process.env.GROQ_API_KEY;
        const emailData = groqApiKey
            ? await generateWithGroq(cleanedPrompt, groqApiKey)
            : generateLocalEmail(cleanedPrompt);

        if (!emailData.subject || !emailData.emailBody) {
            return res.status(500).json({
                message: 'AI generated incomplete email data. Please try again.'
            });
        }

        const historyEntry = await createHistoryEntry({
            userId: req.user._id,
            prompt: cleanedPrompt,
            subject: emailData.subject,
            emailBody: emailData.emailBody,
            linkedInDM: emailData.linkedInDM,
            followUpEmail: emailData.followUpEmail,
            generationMode: emailData.generationMode
        });

        return res.status(200).json(historyEntry);
    } catch (error) {
        console.error('AI Generation Error:', error.response?.data || error.message);

        if (error.response?.status === 429) {
            return res.status(429).json({
                message: 'Too many requests. Please wait a moment before trying again.',
                error: 'Rate limit exceeded'
            });
        }

        return res.status(500).json({
            message: 'Failed to generate email',
            error: error.response?.data?.error?.message || error.message
        });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await getHistoryByUserId(req.user._id);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch history' });
    }
};
