import { GoogleGenAI, Type, Schema } from '@google/genai';
import { config } from 'dotenv';
config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
  
  for (const model of modelsToTry) {
    try {
      console.log(`Trying ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: 'Hello, are you available?',
      });
      console.log(`SUCCESS with ${model}:`, response.text);
      return;
    } catch (e: any) {
      console.error(`FAILED with ${model}:`, e.message);
    }
  }
}

main();
