import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateStoreTasks(storeInfo: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `As an AI field force assistant for Unilever, based on this store detection: "${storeInfo}", generate a list of 3-5 next tasks a field officer should complete. Return as a JSON array of strings. Example: ["Check inventory of Dove soaps", "Audit shelf space for Magnum", "Verify promotional signage"].`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return ["General audit", "Stock check", "Price verification"];
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["General audit", "Check merchandising", "Review last visit feedback"];
  }
}

export async function answerFieldQuery(query: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are an intelligent field force assistant. Answer this query from a field officer: "${query}". If you don't have enough data to answer specifically about Unilever distribution rules, provide a general best practice and say "Please provide more specific store data if you need a precise answer."`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return "I'm having trouble connecting to the intelligence module. Please try again or provide manual input.";
  }
}
