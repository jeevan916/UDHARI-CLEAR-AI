import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const generateContent = async (model: string, contents: any, config: any) => {
  const response = await ai.models.generateContent({
    model,
    contents,
    config
  });
  return JSON.parse(response.text || '{}');
};
