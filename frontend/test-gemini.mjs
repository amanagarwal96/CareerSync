import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
async function test() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY environment variable is not set.");
    return;
  }
  console.log("Testing with Key:", process.env.GEMINI_API_KEY.substring(0, 8) + "...");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("hi");
    const response = await result.response;
    console.log("SUCCESS! Response:", response.text());
  } catch (e) {
    console.error("\nFAILED:", e.message);
    if (e.message.includes("404")) {
      console.log("\n--- TROUBLESHOOTING ---");
      console.log("Your key is NOT authorized for Gemini 1.5.");
      console.log("1. Go to https://aistudio.google.com/");
      console.log("2. Create a NEW API Key in a NEW project.");
    }
  }
}
test();
