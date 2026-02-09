
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Cortex Architect Engine
 * Responsibility: Analyzing application state and proposing code modifications.
 */
export const cortexService = {
  /**
   * Propose a fix for a reported issue or a requested feature.
   */
  async proposeModification(prompt: string, currentFileContext: string): Promise<{
    explanation: string;
    suggestedCode: string;
    fileAffected: string;
    impact: string;
  }> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `
          ACT AS: World-Class Senior Frontend Engineer & System Architect.
          CONTEXT: You are working on "ArrearsFlow Enterprise", a complex Debt Recovery CRM.
          GOAL: Analyze the user's request and provide a precise code modification to the existing system.
          
          USER REQUEST: ${prompt}
          FILE IN CONTEXT: 
          ${currentFileContext}

          OUTPUT REQUIREMENTS:
          - Provide a clear explanation of what is being changed.
          - Provide the FULL content of the file with the changes applied.
          - Identify the primary impact on the system.
          - Return the response in strict JSON format.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              suggestedCode: { type: Type.STRING },
              fileAffected: { type: Type.STRING },
              impact: { type: Type.STRING }
            },
            required: ["explanation", "suggestedCode", "fileAffected", "impact"]
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Cortex Architect Error:", error);
      throw new Error("Cortex reasoning cycle interrupted.");
    }
  },

  /**
   * Analyze system logs for anomalies and propose repairs.
   */
  async analyzeSystemAnomalies(logs: string[]): Promise<string[]> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these system logs for potential bugs or integration breaks: ${logs.join('\n')}. 
        Suggest 3 critical fixes in short, professional bullet points.`,
      });
      return response.text.split('\n').filter(l => l.trim().length > 0);
    } catch (e) {
      return ["Manual integrity check required."];
    }
  }
};
