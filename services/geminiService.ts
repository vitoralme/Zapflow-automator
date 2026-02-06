import { GoogleGenAI } from "@google/genai";
import { GeminiModel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMessage = async (name: string, context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: `You are a helpful assistant drafting a WhatsApp message in Portuguese (Brazil).
      
      Recipient Name: ${name}
      Context/Goal: ${context}
      
      Generate a short, friendly, professional WhatsApp message. 
      Do not include placeholders like [Name]. Use the name provided.
      Do not include subject lines or quotes. Just the message body.
      Keep it under 200 characters if possible.`,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return `Olá ${name}, tudo bem? Entrando em contato sobre: ${context}`;
  }
};

export const batchImproveMessages = async (contacts: {name: string, context: string}[]) => {
    // Placeholder for a bulk operation if needed in future
    return null;
}