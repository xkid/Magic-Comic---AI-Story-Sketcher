import { GoogleGenAI, Type } from "@google/genai";
import { StoryPanel } from "../types";

const apiKey = process.env.API_KEY;

// Initialize the client
const ai = new GoogleGenAI({ apiKey: apiKey });

export const generateMagicalStory = async (): Promise<StoryPanel[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

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
