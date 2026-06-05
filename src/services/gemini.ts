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

export async function analyzeStorefrontImage(dataUrl: string, hint?: string) {
  try {
    if (!apiKey) {
      return {
        storeName: hint || "Unknown Store",
        location: "Unknown",
        confidence: 0
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const base64Data = dataUrl.includes(",") ? dataUrl.split(',')[1] : dataUrl;
    const mimeType = dataUrl.match(/data:([^;]+);/)?.[1] || "image/jpeg";

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };
    
    // Perform OCR to read the text in the image
    const prompt = `You are an expert retail auditor. Look at this storefront photo. 
Identify the store name / business brand displayed on the storefront, awning, or shop sign using Optical Character Recognition (OCR). 
Read the exact shop name visible in the image.
Return ONLY a valid JSON object with the following schema:
{
  "storeName": "Name of the store exactly as read from the image using OCR (or 'Unknown' if no text is legible)",
  "location": "A smart guess of the city based on the language/context/visuals, or 'Unknown'",
  "confidence": <number between 0 and 100>
}
Do not write any markdown code blocks or additional text. Just return the raw JSON.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    return {
      storeName: hint || "Unknown Store",
      location: "Unknown",
      confidence: 50
    };
  }
}

export async function parseAIVoiceCommand(query: string) {
  try {
    const prompt = `You are an intelligent retail field force voice assistant. Analyze the user's voice command: "${query}".
Return ONLY a valid JSON object matching this schema:
{
  "action": "check-in" | "count_inventory" | "mark_out_of_stock" | "unknown",
  "product": "Returns one of these EXACT keys: 'dove-soap', 'dove-shampoo', 'lux-soap', 'lifebuoy-wash', or null",
  "quantity": "Number if count_inventory, or null",
  "feedback": "A short, friendly spoken confirmation of what you just updated"
}`;
    if (!apiKey) {
      if (query.toLowerCase().includes("check")) {
          return { action: "check-in", product: null, quantity: null, feedback: "Simulated AI: I've checked you in to the store." };
      }
      return { action: "unknown", product: null, quantity: null, feedback: "Simulated AI: I heard " + query };
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    return { action: "unknown", product: null, quantity: null, feedback: "I'm offline, but I heard: " + query };
  }
}
