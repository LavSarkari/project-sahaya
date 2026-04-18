import { GoogleGenAI, Type } from "@google/genai";
import { Issue } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface StructuredSignal {
  title: string;
  category: 'FOOD' | 'MEDICAL' | 'WATER' | 'SHELTER' | 'SECURITY';
  priority: 'HIGH' | 'MED' | 'LOW';
  confidence: number;
  aiRecommendation: string;
  riskMessage: string;
}

export const analyzeSignal = async (description: string): Promise<StructuredSignal> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following emergency report description and convert it into a structured signal for humanitarian response.
    
    Description: "${description}"`,
    config: {
      systemInstruction: `You are an emergency response AI agent. Your job is to parse raw human input (often in Hindi or mixed languages) into structured disaster management data.
      Categories: FOOD, MEDICAL, WATER, SHELTER, SECURITY.
      Priorities: HIGH, MED, LOW.
      Confidence: A decimal between 0 and 1.
      Recommendation: A short, actionable step for responders.
      Risk: A warning of what happens if ignored.
      Keep it brief and professional.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short descriptive title" },
          category: { type: Type.STRING, enum: ["FOOD", "MEDICAL", "WATER", "SHELTER", "SECURITY"] },
          priority: { type: Type.STRING, enum: ["HIGH", "MED", "LOW"] },
          confidence: { type: Type.NUMBER },
          aiRecommendation: { type: Type.STRING },
          riskMessage: { type: Type.STRING }
        },
        required: ["title", "category", "priority", "confidence", "aiRecommendation", "riskMessage"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI layer.");
  return JSON.parse(text) as StructuredSignal;
};

export const mergeSignals = async (newSignal: Omit<Issue, 'id' | 'eta'>, existingIssues: Issue[]): Promise<{ shouldMerge: boolean; mergedIssue?: Partial<Issue>; confidenceGrowth?: number }> => {
  if (existingIssues.length === 0) return { shouldMerge: false };

  const context = existingIssues.map(issue => ({
    id: issue.id,
    title: issue.title,
    category: issue.category,
    description: issue.sourceDescriptions?.join(' ') || issue.title
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the Coordination layer of Project Sahaya. We have a new incoming signal and existing active issues in the same area.
    
    NEW SIGNAL:
    Category: ${newSignal.category}
    Title: ${newSignal.title}
    Description: ${newSignal.sourceDescriptions?.[0]}
    
    EXISTING POTENTIAL MATCHES:
    ${JSON.stringify(context, null, 2)}
    
    TASK:
    1. Determine if the NEW SIGNAL describes the SAME physical event or situation as any of the EXISTING issues.
    2. If it is a duplicate/same event, suggest a 'merge'. Provide a refined title and updated recommendation based on the combined information.
    3. If it's a new localized event, mark as 'no merge'.
    
    Output JSON.`,
    config: {
      systemInstruction: `Return a JSON object:
      {
        "shouldMerge": boolean,
        "matchingIssueId": string (if shouldMerge is true),
        "refinedData": {
          "title": string,
          "aiRecommendation": string,
          "riskMessage": string,
          "priority": "HIGH" | "MED" | "LOW"
        },
        "reasoning": string
      }`,
      responseMimeType: "application/json"
    }
  });

  const result = JSON.parse(response.text || '{}');
  if (result.shouldMerge) {
     const matchingIssue = existingIssues.find(i => i.id === result.matchingIssueId);
     if (matchingIssue) {
       return {
         shouldMerge: true,
         mergedIssue: {
           id: matchingIssue.id,
           ...result.refinedData,
           signalCount: (matchingIssue.signalCount || 1) + 1,
           sourceDescriptions: [...(matchingIssue.sourceDescriptions || []), ...(newSignal.sourceDescriptions || [])],
           peopleAffected: matchingIssue.peopleAffected + newSignal.peopleAffected,
           confidence: Math.min(0.99, matchingIssue.confidence + 0.08) // Confidence grows with more reports
         }
       };
     }
  }

  return { shouldMerge: false };
};
