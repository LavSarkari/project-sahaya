import { GoogleGenAI, Type } from "@google/genai";
import { Issue } from "../types";

const genAI = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' 
});


const model = "gemini-3-flash-preview";

// IN-MEMORY CACHE FOR TOKEN OPTIMIZATION
const aiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour lifecycle

const getCached = (key: string) => {
  const cached = aiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCached = (key: string, data: any) => {
  aiCache.set(key, { data, timestamp: Date.now() });
};

export interface StructuredSignal {
  title: string;
  category: 'FOOD' | 'MEDICAL' | 'WATER' | 'SHELTER' | 'SECURITY';
  priority: 'HIGH' | 'MED' | 'LOW';
  confidence: number;
  aiRecommendation: string;
  riskMessage: string;
  isSpamOrFake: boolean;
  rejectionReason: string;
}

/**
 * Parses raw human input into a structured emergency signal while filtering spam.
 */
export const analyzeSignal = async (description: string): Promise<StructuredSignal> => {
  const result = await genAI.models.generateContent({
    model: model,
    contents: `Analyze the following request for help and convert it into a structured report for our volunteer team. If the report is a joke, fake, troll, or entirely unrelated to crisis/emergency relief (e.g., "send me pizza", "zombies attacking"), flag it as spam.
    
    Description: "${description}"`,
    config: {
      systemInstruction: `You are a helpful and strict humanitarian assistance AI. Your job is to parse raw human input into structured relief coordination data.
      You MUST identify and reject fake, joke, or spam reports.
      Categories: FOOD, MEDICAL, WATER, SHELTER, SECURITY.
      Priorities: HIGH, MED, LOW.
      Confidence: A decimal between 0 and 1.
      Spam Check: isSpamOrFake (boolean), and rejectionReason (brief reason if spam/fake).`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["FOOD", "MEDICAL", "WATER", "SHELTER", "SECURITY"] },
          priority: { type: Type.STRING, enum: ["HIGH", "MED", "LOW"] },
          confidence: { type: Type.NUMBER },
          aiRecommendation: { type: Type.STRING },
          riskMessage: { type: Type.STRING },
          isSpamOrFake: { type: Type.BOOLEAN },
          rejectionReason: { type: Type.STRING }
        },
        required: ["title", "category", "priority", "confidence", "aiRecommendation", "riskMessage", "isSpamOrFake", "rejectionReason"]
      }
    }
  });

  const text = result.text;
  if (!text) throw new Error("No response from AI layer.");
  return JSON.parse(text) as StructuredSignal;
};

export const verifyFaceImage = async (base64Data: string, mimeType: string): Promise<{ isHumanFace: boolean; notes: string }> => {
  const result = await genAI.models.generateContent({
    model: model,
    contents: [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      },
      "Analyze this image. Does it clearly contain a real human face? Assume this is being uploaded as a profile picture for a volunteer application."
    ],
    config: {
      systemInstruction: "You are a verification AI. Check if the provided image is a real human face. Return JSON with isHumanFace (boolean) and notes (string explaining why).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isHumanFace: { type: Type.BOOLEAN },
          notes: { type: Type.STRING }
        },
        required: ["isHumanFace", "notes"]
      }
    }
  });

  const text = result.text;
  if (!text) throw new Error("No response from AI layer.");
  return JSON.parse(text);
};

/**
 * Determines if a new signal should be merged with existing issues.
 */
export const mergeSignals = async (newSignal: Omit<Issue, 'id' | 'eta'>, existingIssues: Issue[]): Promise<{ shouldMerge: boolean; mergedIssue?: Partial<Issue>; confidenceGrowth?: number }> => {
  if (existingIssues.length === 0) return { shouldMerge: false };

  const context = existingIssues.map(issue => ({
    id: issue.id,
    title: issue.title,
    category: issue.category,
    description: issue.sourceDescriptions?.join(' ') || issue.title
  }));

  const response = await genAI.models.generateContent({
    model: model,
    contents: `You are a coordinator for Project Sahaya. Determine if the NEW REQUEST describes the SAME situation as the existing requests.
    
    NEW REQUEST: ${newSignal.title} - ${newSignal.sourceDescriptions?.[0]}
    EXISTING: ${JSON.stringify(context)}`,
    config: {
      systemInstruction: "Return JSON: { shouldMerge: boolean, matchingIssueId: string, refinedData: { title, aiRecommendation, riskMessage, priority } }",
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
           confidence: Math.min(0.99, (matchingIssue.confidence || 0.5) + 0.08)
         }
       };
     }
  }

  return { shouldMerge: false };
};

/**
 * Generates a situational summary of multiple issues.
 */
export const generateSummary = async (issues: Issue[]): Promise<string> => {
  if (!issues.length) return "No active incidents detected. Monitor standing by.";

  try {
    const issuesList = issues.map(i => `- ${i.title} (${i.priority})`).join("\n");
    const response = await genAI.models.generateContent({
      model: model,
      contents: `Summarize the current community needs based on these active requests:\n${issuesList}`,
      config: {
        systemInstruction: "You are a humanitarian aid coordinator. Provide a clear, compassionate summary of the situation in exactly 2 lines."
      }
    });

    return response.text || "Failed to generate summary.";
  } catch (error) {
    return "Notes unavailable right now. Please review the requests individually.";
  }
};

/**
 * Provides a detailed tactical breakdown for an incident (Admin/Volunteer only).
 */
export const analyzeTacticalDepth = async (issue: Issue): Promise<string> => {
  const cacheKey = `tactical-${issue.id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: `Provide a practical action plan to assist with this situation:
      Title: ${issue.title}
      Location: ${issue.location}
      Reports: ${issue.signalCount || 1}
      Category: ${issue.category}
      Affected People: ${issue.peopleAffected}
      
      Provide a 3-step action plan: 1. Immediate Safety 2. Resource Needs 3. Follow-up Care.`,
      config: {
        systemInstruction: "You are an experienced NGO coordinator. Be clear, practical, and empathetic."
      }
    });

    const plan = response.text || "Detailed plan currently unavailable.";
    setCached(cacheKey, plan);
    return plan;
  } catch (error) {
    return "Error generating plan. Please follow standard community care guidelines.";
  }
};

/**
 * Direct recommendation generator for single issues.
 */
export const generateRecommendation = async (issue: Issue): Promise<string> => {
   const cacheKey = `rec-${issue.id}`;
   const cached = getCached(cacheKey);
   if (cached) return cached;

   try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: `Suggest the best immediate action for: ${issue.title} (${issue.category}) at ${issue.location}.`,
      config: {
        systemInstruction: "Provide a 1-2 line direct and helpful recommendation for volunteers."
      }
    });
    const rec = response.text || "Unable to generate recommendation.";
    setCached(cacheKey, rec);
    return rec;
  } catch (error) {
    return "Suggestions temporarily offline. Use standard aid protocols.";
  }
};

/**
 * Smart Resource Allocation: Matches available volunteers to an incident.
 */
export const matchVolunteerToTask = async (
  issue: Issue, 
  availableVolunteers: any[]
): Promise<{ 
  matches: Array<{
    userId: string;
    score: number;
    reasoning: string;
    estimatedDeploymentTime: string;
  }>
}> => {
  if (availableVolunteers.length === 0) return { matches: [] };

  // Generate a fingerprint of the volunteer list to ensure cache integrity
  const volFingerprint = availableVolunteers.map(v => v.uid).sort().join(',');
  const cacheKey = `match-${issue.id}-${volFingerprint}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const volunteerContext = availableVolunteers.map(v => ({
    uid: v.uid,
    name: v.name,
    skills: v.skills,
    bio: v.bio,
    coordinates: v.coordinates
  }));

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: `Match the following request for help to the best available volunteers.
      
      REQUEST:
      Title: ${issue.title}
      Category: ${issue.category}
      Priority: ${issue.priority}
      Coordinates: ${JSON.stringify(issue.coordinates)}
      
      VOLUNTEERS:
      ${JSON.stringify(volunteerContext)}`,
      config: {
        systemInstruction: `You are the volunteer coordination assistant for Project Sahaya. 
        Analyze skills, bios, and physical distance (Coordinates) to find the best people to help.
        Return exactly a JSON object: { matches: Array<{ userId, score (0-1), reasoning (1 sentence), estimatedDeploymentTime (e.g. "12 mins") }> }.
        Higher scores go to volunteers with relevant skills and closer proximity.`,
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{"matches": []}');
    setCached(cacheKey, result);
    return result;
  } catch (e) {
    console.error("AI Allocation Error (Likely Rate Limited):", e);
    return { matches: [] };
  }
};


/**
 * Global Strategic Audit: Analyzes the full allocation picture and generates
 * a natural-language strategic summary for coordinators.
 */
export const auditGlobalAllocation = async (
  sectorSummary: string,
  alertsSummary: string
): Promise<string> => {
  const cacheKey = `audit-${sectorSummary.length}-${alertsSummary.length}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: `You are the Chief Coordinator for Project Sahaya. Analyze the current resource allocation situation and provide a strategic assessment.

SECTOR STATUS:
${sectorSummary}

DETECTED MISALLOCATIONS:
${alertsSummary}

Provide a 3-4 sentence strategic assessment that:
1. Identifies the most urgent reallocation needed
2. Highlights any dangerous gaps in coverage
3. Recommends the single most impactful action to take right now

Be direct, concise, and urgent where warranted.`,
      config: {
        systemInstruction: "You are a humanitarian crisis coordinator. Speak in clear operational language. No pleasantries. Max 4 sentences."
      }
    });

    const result = response.text || "Strategic assessment unavailable. Review sector data manually.";
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error("AI Audit Error:", error);
    return "AI strategic assessment temporarily unavailable. Please review the sector matrix and alerts manually for allocation decisions.";
  }
};
