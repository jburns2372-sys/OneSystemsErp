import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { config } from 'dotenv';
config();

async function main() {
  const schema = z.object({
    phases: z.array(z.object({
      code: z.string(),
      name: z.string()
    })).length(10)
  });

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: schema,
      prompt: "Give me 10 construction phases."
    });
    console.log("SUCCESS:", object.phases.length);
  } catch(e) {
    console.error("ERROR:", e);
  }
}
main();
