import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    // In a real implementation, you would pass 'context' to the model to provide map data.
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Context: ${JSON.stringify(context)}\n\nPrompt: ${prompt}`,
    });

    res.json({ response: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to communicate with AI assistant' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
