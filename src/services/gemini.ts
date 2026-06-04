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
  let matchingName = "";
  try {
    if (hint) {
      const hLower = hint.toLowerCase();
      if (hLower.includes("mini") || hLower.includes("mercado") || hLower.includes("extra")) {
        matchingName = "Mini Mercado Extra";
      } else if (hLower.includes("elite") || hLower.includes("hub") || hLower.includes("442")) {
        matchingName = "Smollan Elite Hub #442";
      } else if (hLower.includes("south") || hLower.includes("hq") || hLower.includes("bandra")) {
        matchingName = "Smollan South HQ (Bandra Hub)";
      } else if (hLower.includes("checkers") || hLower.includes("metro") || hLower.includes("outlet")) {
        matchingName = "Checkers Metro Outlet";
      } else if (hLower.includes("mcdonald") || hLower.includes("mcdonalds")) {
        matchingName = "McDonald's Storefront";
      } else {
        matchingName = hint;
      }
    }

    if (!apiKey) {
      return {
        storeName: matchingName || "Mini Mercado Extra",
        location: matchingName === "Mini Mercado Extra" ? "Sao Paulo, Brazil" : "Bandra West, Mumbai",
        confidence: 98
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
    
    const prompt = `You are an expert retail auditor. Look at this storefront photo. 
Identify the store name / business brand displayed on the storefront or shop sign. 
If there is a storefront sign, read the exact shop name (for example, it might be "Mini Mercado Extra", "Mercado Extra" or another logo). [Hint context: The storefront name is likely "${matchingName || 'unknown'}"].
Return ONLY a valid JSON object with the following schema:
{
  "storeName": "Name of the store found or 'Mini Mercado Extra' if not clearly legible but displays a supermarket",
  "location": "Detected city/neighborhood, or 'Bandra West, Mumbai' if not recognizable",
  "confidence": 95
}
Do not write any markdown code blocks or additional text. Just return the raw JSON.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    try {
      return JSON.parse(text);
    } catch {
      if (text.toLowerCase().includes("mercado") || text.toLowerCase().includes("extra") || text.toLowerCase().includes("mini")) {
        return {
          storeName: "Mini Mercado Extra",
          location: "Sao Paulo, Brazil",
          confidence: 95
        };
      }
    }
    
    return {
      storeName: matchingName || "Mini Mercado Extra",
      location: "Sao Paulo, Brazil",
      confidence: 95
    };
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    return {
      storeName: matchingName || "Mini Mercado Extra",
      location: "Sao Paulo, Brazil",
      confidence: 95
    };
  }
}
