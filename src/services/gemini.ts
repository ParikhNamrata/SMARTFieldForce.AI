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
    const prompt = `You are a precision retail auditor performing Optical Character Recognition (OCR) on a storefront photo. 
Identify exactly ONE store name / business brand visible in the image.

CRITICAL INSTRUCTIONS:
1. Analysis: Carefully read the text on the main shop sign, awning, or storefront.
2. Selection: Compare the text you see in the image with the CANDIDATE LIST provided below.
3. Decisive Action: You MUST pick the SINGLE best match from the CANDIDATE LIST.
4. Negative Constraint: DO NOT return more than one store name. DO NOT return the entire candidate list.
5. Fallback: If no match is found in the list, return the exact text you see in the image.

${hint ? `CANDIDATE LIST (Pick ONLY one from here):\n${hint}` : "No candidate list provided. Identify the name from the image text only."}

Return ONLY a valid JSON object with the following schema:
{
  "storeName": "Name of the single store identified",
  "location": "City/Area or 'Unknown'",
  "confidence": <integer 0-100>
}
NO other text, markdown, or explanation. ONLY raw JSON.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    
    const jsonMatch = text.match(/\{.*\}/s);
    let analysis = { storeName: "Unknown", location: "Unknown", confidence: 0 };
    
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      analysis = JSON.parse(text);
    }

    // Safety check: if the model echoed the candidate list instead of picking one
    if (hint && analysis.storeName.includes("\n") || analysis.storeName.includes("•")) {
       const candidates = hint.split("\n").map(c => c.replace(/^•\s*/, "").trim());
       // Try to find if one of the candidates is the first thing in the string
       for (const cand of candidates) {
         if (analysis.storeName.includes(cand)) {
           analysis.storeName = cand;
           break;
         }
       }
    }
    
    return analysis;
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

export async function analyzeSKUImage(dataUrl: string) {
  try {
    if (!apiKey) {
      return {
        totalSkus: 156,
        breakdown: { 'dove-soap': 45, 'dove-shampoo': 30, 'lux-soap': 45, 'lifebuoy-wash': 36 },
        confidence: 80
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
    
    const prompt = `You are a precision retail auditor. Perform an Image Recognition (IR) audit on this shelf photo.
Identify and count all Unilever products.

Return ONLY a valid JSON object with exactly this schema:
{
  "totalSkus": number,
  "breakdown": {
    "dove-soap": number,
    "dove-shampoo": number,
    "lux-soap": number,
    "lifebuoy-wash": number
  },
  "confidence": number
}
No markdown, no explanation. Just raw JSON.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(text);
  } catch (error) {
    console.error("SKU Analysis Error:", error);
    return {
      totalSkus: 0,
      breakdown: {},
      confidence: 0
    };
  }
}
