import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export function enhanceImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    
    // FIX: Catch loading errors so the Promise never hangs indefinitely
    img.onerror = (error) => {
      console.warn("Enhancement failed, falling back to raw dataUrl:", error);
      resolve(dataUrl); 
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      // 1. OPTIMIZE RESOLUTION (Crucial for API performance)
      // Giant 4K/12MP mobile images slow down API requests and add noise.
      // Scaling down to a max boundary of 1600px retains crisp text while shrinking payload.
      const MAX_DIMENSION = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 2. HARDWARE-ACCELERATED NATIVE FILTERS (Preserves Color)
      // Gemini needs color data to segment text from complex shop backgrounds.
      // We apply a safe contrast and saturation bump without destroying edge pixels.
      ctx.filter = 'contrast(1.2) brightness(1.02) saturate(1.1)';
      
      // Draw the image with smooth resizing
      ctx.drawImage(img, 0, 0, width, height);

      // 3. EXPORT AS PNG OR HIGH-QUALITY WEBP
      // 'image/jpeg' creates blocky artifacts right around text edges. 
      // PNG keeps the text razor-sharp for the AI model.
      resolve(canvas.toDataURL('image/png'));
    };

    img.src = dataUrl;
  });
}
export function prepareGeminiPayload(dataUrl: string) {
  // Split the data URL at the comma
  const parts = dataUrl.split(',');
  const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const base64Data = parts[1];

  return {
    inlineData: {
      data: base64Data, // Crucial: This is now pure base64 text without the "data:image/png;base64," prefix
      mimeType: mimeType
    }
  };
}
async function processShopBoardOCR(rawImageDataUrl: string) {
  try {
    // Step 1: Run the optimized enhancement
    const enhancedDataUrl = await enhanceImage(rawImageDataUrl);
    
    // Step 2: Strip the prefix and format for Gemini
    const imagePart = prepareGeminiPayload(enhancedDataUrl);
    
    // Step 3: Combine with a fallback-safe, direct prompt
    const promptPart = {
      text: "Identify the primary store name written on this shop board. Return only the name, nothing else."
    };

    // Example payload for the official Google client or raw fetch endpoint
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent([promptPart, imagePart]);
    console.log("OCR Result:", response.response);
    
  } catch (error) {
    console.error("OCR Pipeline Failed:", error);
  }
}