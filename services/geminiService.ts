import { GoogleGenerativeAI } from "@google/generative-ai";

declare const process: { env: { GEMINI_API_KEY?: string; API_KEY?: string } };

/** Gemini model id (see https://ai.google.dev/gemini-api/docs/models/gemini). */
const CHAT_MODEL = "gemini-2.0-flash";

let cachedGen: GoogleGenerativeAI | null = null;
let cachedForKey = "";

function getApiKey(): string {
  const fromMeta =
    typeof import.meta !== "undefined" && import.meta.env
      ? String(
          import.meta.env.VITE_GEMINI_API_KEY ||
            (import.meta.env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY ||
            ""
        ).trim()
      : "";
  const fromProcess = (process.env.GEMINI_API_KEY || process.env.API_KEY || "").trim();
  return fromMeta || fromProcess;
}

function getGenAI(): GoogleGenerativeAI | null {
  const key = getApiKey();
  if (!key) {
    cachedGen = null;
    cachedForKey = "";
    return null;
  }
  if (cachedGen && cachedForKey === key) return cachedGen;
  cachedGen = new GoogleGenerativeAI(key);
  cachedForKey = key;
  return cachedGen;
}

/** True when any supported env source provides a non-empty key (for UI hints). */
export function isGeminiConfigured(): boolean {
  return getApiKey().length > 0;
}

const SYSTEM_INSTRUCTION = `You are the chief stylist and brand curator at KNOTTY TOWN, India's premium oversized streetwear label. 
Our identity is "Luxury with Personality". 
We specialize in 240+ GSM heavy-weight sinker cotton, boxy fits, and bold prints.
Your tone: Edgy, high-energy, street-smart, and professional. 

IMPORTANT: You are an expert on our collection. 
When recommending products, you MUST include the tag [[PRODUCT:id]].
Only recommend products from the provided inventory context.`;

export const getFastAdvice = async (prompt: string) => {
  const genAI = getGenAI();
  if (!genAI) return "The signal is weak, but your drip is still loud.";
  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION + " Keep it short. Max 40 words."
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The signal is weak, but your drip is still loud.";
  }
};

export const analyzeSalesData = async (ordersContext: string, inventoryContext: string) => {
  const genAI = getGenAI();
  if (!genAI) return "SYSTEM OVERLOAD. The trends are moving too fast. Try again later.";
  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: "You are the KNOTTY TOWN Business Analyst from the future. Analyze the provided sales data and inventory. Identify high-velocity items, dead stock, and emerging trends. Suggest 3 specific new design concepts (Graphics/Fits) based on what IS selling. Be ruthless and data-driven. Format with emojis and bold headers."
    });

    const result = await model.generateContent(`ORDERS REPORT:\n${ordersContext}\n\nCURRENT INVENTORY:\n${inventoryContext}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Sales Analysis Error:", error);
    return "SYSTEM OVERLOAD. The trends are moving too fast. Try again later.";
  }
};

export const analyzeDripAesthetic = async (imageBase64: string, inventoryContext: string) => {
  const genAI = getGenAI();
  if (!genAI) return "Signal scrambled. Aesthetic too loud.";
  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      },
      { text: `Analyze this aesthetic mood and suggest matching products from our inventory:\n${inventoryContext}` }
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Drip Vision Error:", error);
    return "Signal scrambled. Aesthetic too loud.";
  }
};

export const createStyleAgentChat = (inventoryContext: string) => {
  const genAI = getGenAI();
  if (!genAI) return null;
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCURRENT INVENTORY:\n${inventoryContext}\n\nHelp the customer find the perfect drop.`
  });

  return model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.8,
    },
  });
};

export const generateDescription = async (productName: string, category: string, attributes?: string[]) => {
  const genAI = getGenAI();
  if (!genAI) return "";
  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION + "\nYour task is to write a punchy, 2-3 sentence product description. Use sensory words (heavyweight, crisp, boxy). Include a sense of exclusivity. Do NOT use generic marketing fluff. Keep it raw and street-ready."
    });

    const prompt = `Write a description for: ${productName} (Category: ${category}). ${attributes ? 'Key features: ' + attributes.join(', ') : ''}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Description Gen Error:", error);
    return "";
  }
};

export const analyzeTextSearch = async (query: string, inventoryContext: string) => {
  const genAI = getGenAI();
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: "You are an AI search assistant for KNOTTY TOWN. Given a natural language query and our inventory, return a comma-separated list of Product IDs that best match the query. ONLY return the IDs, no other text."
    });

    const prompt = `Query: "${query}"\n\nInventory:\n${inventoryContext}\n\nReturn a comma-separated list of matching Product IDs.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Search Error:", error);
    return null;
  }
};
