import { GoogleGenAI, Type } from "@google/genai";
import { Issue } from "../types";

// Initialize Gemini
// In this environment, GEMINI_API_KEY is injected at runtime
const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

const model = "gemini-3-flash-preview";

export interface StructuredReport {
  issueTypes: string[];
  urgency: number;
  peopleAffected: number;
  location: string;
}

/**
 * A. parseReport(text)
 * Extracts structured data from raw humanitarian reports.
 */
export async function parseReport(text: string): Promise<StructuredReport | null> {
  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: `Extract structured data from this report: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issueTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
            urgency: { type: Type.NUMBER, description: "1-10 scale" },
            peopleAffected: { type: Type.NUMBER },
            location: { type: Type.STRING }
          },
          required: ["issueTypes", "urgency", "peopleAffected", "location"]
        }
      }
    });

    const result = response.text;
    return JSON.parse(result) as StructuredReport;
  } catch (error) {
    console.error("AI Parse Error:", error);
    return null;
  }
}

/**
 * B. generateRecommendation(issue)
 * Suggests the best action for a specific issue.
 */
export async function generateRecommendation(issue: Issue): Promise<string> {
  try {
    const prompt = `Given this issue:
    Title: ${issue.title}
    Category: ${issue.category}
    Location: ${issue.location}
    Affected: ${issue.peopleAffected}
    Priority: ${issue.priority}
    
    Suggest the best action in 1-2 lines. Be direct and pragmatic.`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "You are a crisis management expert. Provide concise, clear, and actionable recommendations."
      }
    });

    return response.text || "Unable to generate recommendation.";
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return "Tactical advice offline. Proceed with standard protocols.";
  }
}

/**
 * C. generateSummary(issues)
 * Summarizes the entire situation on the dashboard.
 */
export async function generateSummary(issues: Issue[]): Promise<string> {
  if (!issues.length) return "No active incidents detected. Monitor standing by.";

  try {
    const issuesList = issues.map(i => `- ${i.title} (${i.priority})`).join("\n");
    const prompt = `Summarize the current situation in Lucknow based on these reported incidents:\n${issuesList}\n\nSummarize in exactly 2 lines. Focus on current threat levels and resource needs.`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "You are a crisis command center analyst. Provide a high-level strategic summary."
      }
    });

    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "Error synchronizing situational summary. Check manual feed.";
  }
}
