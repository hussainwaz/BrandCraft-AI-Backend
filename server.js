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
    
    const prompt = `Suggest THREE distinct color palettes and font pairings for a brand in the "${niche}" industry with a "${tone}" tone.
    Respond in JSON format with this exact structure:
    {
      "colorPalettes": [
        {
          "id": "1",
          "name": "Descriptive name",
          "colors": {
            "primary": "#HEXCODE",
            "secondary": "#HEXCODE",
            "accent": "#HEXCODE",
            "background": "#HEXCODE",
            "text": "#HEXCODE"
          }
        },
        {
          "id": "2",
          "name": "Descriptive name",
          "colors": { ... }
        },
        {
          "id": "3",
          "name": "Descriptive name",
          "colors": { ... }
        }
      ],
      "fontPairings": [
        {
          "id": "1",
          "name": "Descriptive name",
          "heading": {
            "name": "Font Name",
            "family": "Font Name, sans-serif",
            "weight": "400-900"
          },
          "body": {
            "name": "Font Name",
            "family": "Font Name, sans-serif",
            "weight": "400-900"
          }
        },
        {
          "id": "2",
          "name": "Descriptive name",
          "heading": { ... },
          "body": { ... }
        },
        {
          "id": "3",
          "name": "Descriptive name",
          "heading": { ... },
          "body": { ... }
        }
      ]
    }
    Each color palette should include exactly 5 colors (primary, secondary, accent, background, text).
    Each font pairing should include a heading and body font with proper font-family syntax.
    Make the three options visually and conceptually distinct.`;

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

            // Validate we got the expected structure
            if (!brandStyles.colorPalettes || !brandStyles.fontPairings || 
                brandStyles.colorPalettes.length !== 3 || 
                brandStyles.fontPairings.length !== 3) {
                throw new Error("AI didn't return the expected format");
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