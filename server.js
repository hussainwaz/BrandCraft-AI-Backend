const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 1000;

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL, 
    'http://localhost:3000',
    'http://localhost:5173'  // Add your Vite dev server origin
  ],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

app.post('/api/brand-style', async (req, res) => {
    const { niche, tone } = req.body;
    
    // Generate two different options
    const prompt = `Suggest TWO distinct font pairings (header + body) and color palettes for a brand in the "${niche}" industry with a "${tone}" tone.
    Respond in JSON format with this exact structure:
    {
      "options": [
        {
          "name": "Option 1 - [Brief descriptive name]",
          "fonts": {
            "header": {
              "name": "Font Name",
              "description": "Font description",
              "source": "Where to get it"
            },
            "body": {
              "name": "Font Name",
              "description": "Font description",
              "source": "Where to get it"
            }
          },
          "colors": [
            {
              "name": "Color Name",
              "value": "#HEXCODE",
              "description": "Color usage suggestion"
            }
          ],
          "usageGuidelines": "How to use these elements together",
          "rationale": "Why this combination works well"
        },
        {
          "name": "Option 2 - [Brief descriptive name]",
          "fonts": { ... },
          "colors": [ ... ],
          "usageGuidelines": "...",
          "rationale": "..."
        }
      ]
    }
    Each option should include exactly 5 colors in the palette. Make the two options visually and conceptually distinct.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "deepseek/deepseek-r1-0528:free",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        let brandStyles;
        try {
            let rawContent = completion.choices[0].message.content.trim();
            if (rawContent.startsWith("```")) {
                rawContent = rawContent.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
            }

            brandStyles = JSON.parse(rawContent);

            // Validate we got two options
            if (!brandStyles.options || brandStyles.options.length !== 2) {
                throw new Error("AI didn't return two options");
            }

            res.json(brandStyles);
        } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            res.status(500).json({ error: "AI returned malformed response" });
        }
    } catch (err) {
        console.error("AI request failed:", err.response?.data || err.message);
        res.status(500).json({ error: 'AI request failed' });
    }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});