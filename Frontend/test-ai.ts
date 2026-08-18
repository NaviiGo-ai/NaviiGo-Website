import { fetchDestinationDataWithGemini } from './lib/ai/geminiItinerary';

// Mock dotenv loading since we aren't in Next.js runtime
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  console.log("Calling Gemini for Fake Place...");
  try {
      const data = await fetchDestinationDataWithGemini({
        destName: "asdfasdfasdf",
        purpose: "cultural",
        budget: 50000,
        days: 3
      });
      console.log("Success! Received payload:");
      if (data) {
          console.log(JSON.stringify(data).substring(0, 1000) + "...");
      } else {
          console.log("Returned null!");
      }
  } catch (err) {
      console.error(err);
  }
}

run();
