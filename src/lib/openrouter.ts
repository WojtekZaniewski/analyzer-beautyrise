import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import { AnalysisResult } from "./types";

function getClient() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

export async function runResearch(prompt: string): Promise<string> {
  try {
    const model = getClient().getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.3,
      },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Research failed:", error);
    return "";
  }
}

const analysisSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    executiveSummary: {
      type: SchemaType.OBJECT,
      properties: {
        situation: { type: SchemaType.STRING, description: "Obecny stan salonu (fakty)" },
        complication: { type: SchemaType.STRING, description: "Zidentyfikowany problem" },
        resolution: { type: SchemaType.STRING, description: "Glowna rekomendacja strategiczna" },
        overallScore: { type: SchemaType.INTEGER, description: "Ocena ogolna 1-10" },
      },
      required: ["situation", "complication", "resolution", "overallScore"],
    },
    swot: {
      type: SchemaType.OBJECT,
      properties: {
        strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        opportunities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        threats: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"],
    },
    categories: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          score: { type: SchemaType.INTEGER },
          hypothesis: { type: SchemaType.STRING, description: "Hipoteza do przetestowania" },
          evidence: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Dowody potwierdzajace/obalajace" },
          findings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["name", "score", "hypothesis", "evidence", "findings", "recommendations"],
      },
    },
    actionPlan: {
      type: SchemaType.OBJECT,
      properties: {
        quickWins: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              area: { type: SchemaType.STRING },
              action: { type: SchemaType.STRING },
              expectedImpact: { type: SchemaType.STRING },
              kpiMetric: { type: SchemaType.STRING },
            },
            required: ["area", "action", "expectedImpact"],
          },
        },
        coreChanges: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              area: { type: SchemaType.STRING },
              action: { type: SchemaType.STRING },
              expectedImpact: { type: SchemaType.STRING },
              kpiMetric: { type: SchemaType.STRING },
            },
            required: ["area", "action", "expectedImpact"],
          },
        },
        transformation: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              area: { type: SchemaType.STRING },
              action: { type: SchemaType.STRING },
              expectedImpact: { type: SchemaType.STRING },
              kpiMetric: { type: SchemaType.STRING },
            },
            required: ["area", "action", "expectedImpact"],
          },
        },
      },
      required: ["quickWins", "coreChanges", "transformation"],
    },
    keyMetrics: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          metric: { type: SchemaType.STRING },
          current: { type: SchemaType.STRING },
          target: { type: SchemaType.STRING },
          timeline: { type: SchemaType.STRING },
        },
        required: ["metric", "current", "target", "timeline"],
      },
    },
  },
  required: ["executiveSummary", "swot", "categories", "actionPlan", "keyMetrics"],
};

export async function runAnalysis(
  systemPrompt: string,
  userPrompt: string
): Promise<AnalysisResult> {
  const model = getClient().getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 8000,
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });

  const result = await model.generateContent(userPrompt);
  const content = result.response.text();

  console.log("[analysis] Raw response length:", content.length);
  console.log("[analysis] First 300 chars:", content.slice(0, 300));

  try {
    return JSON.parse(content) as AnalysisResult;
  } catch (err) {
    console.error("[analysis] JSON parse failed:", err);
    console.error("[analysis] Full content:", content.slice(0, 1000));
    return {
      executiveSummary: {
        situation: "Nie udalo sie przetworzyc analizy.",
        complication: "Blad parsowania odpowiedzi AI.",
        resolution: content.slice(0, 500),
        overallScore: 0,
      },
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      categories: [],
      actionPlan: { quickWins: [], coreChanges: [], transformation: [] },
      keyMetrics: [],
    };
  }
}
