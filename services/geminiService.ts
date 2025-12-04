import { GoogleGenAI, Type } from "@google/genai";
import { StoryPanel } from "../types";

// Helper to safely get API key from various environment configurations
const getApiKey = (): string | undefined => {
  // 1. Check for Vite environment (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
      // @ts-ignore
      if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
    }
  } catch (e) {
    // Ignore errors if import.meta is not supported
  }

  // 2. Check for Standard/CRA/Next.js environment (process.env)
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Check common prefixes used by deployment providers and frameworks
      return process.env.API_KEY || 
             process.env.REACT_APP_API_KEY || 
             process.env.VITE_API_KEY || 
             process.env.NEXT_PUBLIC_API_KEY;
    }
  } catch (e) {
    // Ignore errors if process is not defined
  }
  
  return undefined;
};

export const generateMagicalStory = async (): Promise<StoryPanel[]> => {
  const apiKey = getApiKey();
  
  // Initialize inside the function to avoid top-level crash if key is missing on load
  if (!apiKey) {
    throw new Error(
      "API Key not found. If deploying to Vercel/Netlify, please ensure your Environment Variable is named 'VITE_API_KEY' or 'REACT_APP_API_KEY'."
    );
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const model = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model: model,
    contents: "Write a whimsical, magical short story split exactly into 4 comic book panels. The story should be fun and visual.",
    config: {
      systemInstruction: "You are a creative comic book writer. You provide stories split into 4 distinct panels. Keep text concise.",
      temperature: 1.0,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The narration or dialogue for this panel.",
            },
            sceneDescription: {
              type: Type.STRING,
              description: "A short visual description of what the user should draw in this panel.",
            },
          },
          required: ["text", "sceneDescription"],
        },
      },
    },
  });

  const rawData = response.text;
  
  if (!rawData) {
    throw new Error("No content generated");
  }

  try {
    const parsed = JSON.parse(rawData);
    // Add IDs for React rendering
    return parsed.map((item: any, index: number) => ({
      id: index + 1,
      text: item.text,
      sceneDescription: item.sceneDescription
    }));
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to process story data");
  }
};