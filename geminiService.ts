
import { GoogleGenAI, Type } from "@google/genai";

// Always use the named parameter for apiKey and obtain from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface TransitInsight {
  analysis: string;
  predictedOccupancy: 'Low' | 'Medium' | 'High';
}

export const getTransitAnalysis = async (routeName: string, destination: string): Promise<TransitInsight> => {
  try {
    const hour = new Date().getHours();
    
    // Using ai.models.generateContent directly as per guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Current time in Dublin: ${hour}:00. Route: ${routeName} towards ${destination}. 
      Task: Provide a 2-sentence transit update and predict passenger volume (Low, Medium, or High).
      Return ONLY a JSON object with keys "analysis" (string) and "occupancy" (one of: Low, Medium, High).`,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            occupancy: { type: Type.STRING, description: "Low, Medium, or High" }
          },
          required: ["analysis", "occupancy"]
        }
      }
    });

    // Extracting text output from GenerateContentResponse using the .text property
    const data = JSON.parse(response.text || '{}');
    return {
      analysis: data.analysis || "Service is running normally.",
      predictedOccupancy: (data.occupancy as 'Low' | 'Medium' | 'High') || 'Medium'
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      analysis: "Buses are running at 10-minute intervals. Traffic is steady.",
      predictedOccupancy: 'Medium'
    };
  }
};
