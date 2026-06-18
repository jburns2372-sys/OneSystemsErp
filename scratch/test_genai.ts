import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    // Test 2.5 flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello!");
    console.log("2.5-flash result:", result.response.text());
  } catch (e: any) {
    console.error("2.5-flash error:", e.message);
  }
}

main();
