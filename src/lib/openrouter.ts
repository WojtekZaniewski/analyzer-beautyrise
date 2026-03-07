import { AnalysisResult } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FREE_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenRouter(params: {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: FREE_MODEL,
      messages: params.messages,
      max_tokens: params.maxTokens || 4000,
      temperature: params.temperature || 0.3,
      ...(params.jsonMode && { response_format: { type: "json_object" } }),
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errorText.slice(0, 500)}`);
  }

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    console.error("[openrouter] Unexpected response:", JSON.stringify(data).slice(0, 500));
    throw new Error("OpenRouter returned empty response");
  }

  return data.choices[0].message.content;
}

export async function runResearch(prompt: string): Promise<string> {
  try {
    console.log("[research] Starting...");
    const text = await callOpenRouter({
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
  const content = await callOpenRouter({
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
