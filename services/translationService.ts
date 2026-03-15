import { GoogleGenAI } from "@google/genai";

const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
let ai: any = null;

if (hasApiKey) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI:', error);
    ai = null;
  }
}

export const translateText = async (text: string): Promise<string> => {
  if (!text) return "";
  if (!ai) {
    return text;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to English. If it is already in English, translate it to Arabic. Only return the translated text: "${text}"`,
    });
    
    return response.text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};
