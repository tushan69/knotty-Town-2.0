import { GoogleGenerativeAI } from "@google/generative-ai";

/** Gemini model id. */
const CHAT_MODEL = "gemini-2.0-flash";

const SYSTEM_INSTRUCTION = `You are the chief stylist and brand curator at KNOTTY TOWN, India's premium oversized streetwear label. 
Our identity is "Luxury with Personality". 
We specialize in 240+ GSM heavyweight sinker cotton, boxy fits, and bold prints.
Your tone: Edgy, high-energy, street-smart, and professional. 

IMPORTANT: You are an expert on our collection. 
When recommending products, you MUST include the tag [[PRODUCT:id]].
Only recommend products from the provided inventory context.`;

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/** 
 * Returns true if standard client-side Gemini credentials are configuration present.
 * Keeps offline badges fully responsive if keys are not defined.
 */
export function isGeminiConfigured(): boolean {
  return !!apiKey.trim();
}

export const getFastAdvice = async (prompt: string) => {
  try {
    if (!isGeminiConfigured()) return "The signal is weak, but your drip is still loud.";
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION + " Keep it short. Max 40 words."
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "The signal is weak, but your drip is still loud.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The signal is weak, but your drip is still loud.";
  }
};

export const analyzeSalesData = async (ordersContext: string, inventoryContext: string) => {
  try {
    if (!isGeminiConfigured()) return "SYSTEM OVERLOAD. The trends are moving too fast. Try again later.";
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: "You are the KNOTTY TOWN Business Analyst from the future. Analyze the provided sales data and inventory. Identify high-velocity items, dead stock, and emerging trends. Suggest 3 specific new design concepts (Graphics/Fits) based on what IS selling. Be ruthless and data-driven. Format with emojis and bold headers."
    });
    const prompt = `ORDERS REPORT:\n${ordersContext}\n\nCURRENT INVENTORY:\n${inventoryContext}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "SYSTEM OVERLOAD. The trends are moving too fast. Try again later.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "SYSTEM OVERLOAD. The trends are moving too fast. Try again later.";
  }
};

export const analyzeDripAesthetic = async (imageBase64: string, inventoryContext: string) => {
  try {
    if (!isGeminiConfigured()) return "Signal scrambled. Aesthetic too loud.";
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    let mimeType = "image/jpeg";
    if (imageBase64.includes("image/png")) mimeType = "image/png";
    if (imageBase64.includes("image/webp")) mimeType = "image/webp";

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      },
      { text: `Analyze this aesthetic mood and suggest matching products from our inventory:\n${inventoryContext}` }
    ]);
    
    const response = await result.response;
    return response.text() || "Signal scrambled. Aesthetic too loud.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Signal scrambled. Aesthetic too loud.";
  }
};

export const createStyleAgentChat = (inventoryContext: string) => {
  if (!isGeminiConfigured()) return null;

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCURRENT INVENTORY:\n${inventoryContext}\n\nHelp the customer find the perfect drop.`
  });

  return model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.8
    }
  });
};

export const generateDescription = async (productName: string, category: string, attributes?: string[]) => {
  try {
    if (!isGeminiConfigured()) return "";
    const sys = SYSTEM_INSTRUCTION + "\nYour task is to write a punchy, 2-3 sentence product description. Use sensory words (heavyweight, crisp, boxy). Include a sense of exclusivity. Do NOT use generic marketing fluff. Keep it raw and street-ready.";
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: sys
    });
    
    const prompt = `Write a description for: ${productName} (Category: ${category}). ${attributes ? 'Key features: ' + attributes.join(', ') : ''}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};

export const analyzeTextSearch = async (query: string, inventoryContext: string) => {
  try {
    if (!isGeminiConfigured()) return null;
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: "You are an AI search assistant for KNOTTY TOWN. Given a natural language query and our inventory, return a comma-separated list of Product IDs that best match the query. ONLY return the IDs, no other text."
    });
    
    const prompt = `Query: "${query}"\n\nInventory:\n${inventoryContext}\n\nReturn a comma-separated list of matching Product IDs.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || null;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const analyzeCloudStatus = async () => {
  try {
    if (!isGeminiConfigured()) return "SIGNAL LOST. SERVER CLUSTER UNREACHABLE.";
    const { hostingerService } = await import('./hostingerService');
    const accounts = await hostingerService.getAccounts();
    const domains = await hostingerService.getDomains();
    
    const context = `
      SERVERS: ${JSON.stringify(accounts)}
      DOMAINS: ${JSON.stringify(domains)}
    `;

    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: "You are the KNOTTY TOWN Cloud Architect. Analyze the provided Hostinger infrastructure data. Report on uptime, expiration risks, and server health. Keep it executive, high-tech, and futuristic. Use bold headers and emojis."
    });

    const prompt = `Analyze this infrastructure:\n${context}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "CLOUD INTEL UNAVAILABLE.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "SIGNAL LOST. SERVER CLUSTER UNREACHABLE.";
  }
};
