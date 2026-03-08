import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function translateText(text: string, targetLanguage: string = 'English'): Promise<string> {
  try {
    const model = ai.models.generateContent;
    const prompt = `Translate the following text to ${targetLanguage}: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const translatedText = response.text;
    if (translatedText) {
      return translatedText.trim();
    }
    return 'Translation failed';
  } catch (error) {
    console.error('Error translating text:', error);
    return 'Translation error';
  }
}
