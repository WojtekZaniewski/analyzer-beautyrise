import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import { AnalysisResult } from "./types";

function getClient() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeout = new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms));
  return Promise.race([promise, timeout]);
}

export async function runResearch(prompt: string): Promise<string> {
  try {
    const model = getClient().getGenerativeModel({
      model: "gemini-2.5-flash",
      // @ts-expect-error — googleSearch grounding nie w typach SDK v0.24, ale API je akceptuje
      tools: [{ googleSearch: {} }],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.3,
      },
    });
    console.log("[research] Starting with Google Search grounding...");
    const result = await withTimeout(
      model.generateContent(prompt),
      45000,
      null
    );
    if (!result) {
      console.error("[research] Timed out after 45s");
      return "";
    }
    const text = result.response.text();
    console.log("[research] Done, length:", text.length);
    return text;
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
    model: "gemini-2.0-flash-lite",
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 8000,
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      // @ts-expect-error — thinkingConfig nie w typach SDK v0.24, ale API je akceptuje
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  console.log("[analysis] Starting...");
  const result = await model.generateContent(userPrompt);
  const content = result.response.text();

  console.log("[analysis] Done, length:", content.length);
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
