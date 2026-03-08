import OpenAI from "openai";
import { AnalysisResult } from "./types";

const providers = [
  {
    name: "cerebras",
    baseURL: "https://api.cerebras.ai/v1",
    apiKey: process.env.CEREBRAS_API_KEY,
    model: "llama-3.1-8b",
  },
  {
    name: "google",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: "gemini-2.5-flash",
  },
];

async function callWithFallback(params: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<string> {
  let lastError: unknown;

  for (const provider of providers) {
    if (!provider.apiKey) continue;

    try {
      const client = new OpenAI({
        baseURL: provider.baseURL,
        apiKey: provider.apiKey,
      });

      const response = await client.chat.completions.create({
        model: provider.model,
        messages: params.messages,
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature || 0.3,
        ...(params.jsonMode && { response_format: { type: "json_object" as const } }),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error(`${provider.name} returned empty response`);
      }

      console.log(`[${provider.name}] Success, length: ${content.length}`);
      return content;
    } catch (error) {
      console.error(`[${provider.name}] AI provider failed:`, error);
      lastError = error;
    }
  }

  throw lastError ?? new Error("No AI providers configured");
}

export async function runResearch(prompt: string): Promise<string> {
  try {
    console.log("[research] Starting...");
    const text = await callWithFallback({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 4000,
      temperature: 0.3,
    });
    console.log("[research] Done, length:", text.length);
    return text;
  } catch (error) {
    console.error("[research] Failed:", error);
    return "";
  }
}

export async function runAnalysis(
  systemPrompt: string,
  userPrompt: string
): Promise<AnalysisResult> {
  console.log("[analysis] Starting...");
  const content = await callWithFallback({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 8000,
    temperature: 0.3,
    jsonMode: true,
  });

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
