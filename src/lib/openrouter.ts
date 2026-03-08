import { AnalysisResult } from "./types";

// Gemini (primary - fast, 5-15s)
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

// OpenRouter (fallback - slower but always available)
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = [
  "arcee-ai/trinity-large-preview:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-3-27b-it:free",
];

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallParams {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

async function tryGemini(params: CallParams): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const systemInstruction = params.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");

  const contents = params.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[ai] Trying Gemini ${model}`);
      const response = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(systemInstruction && {
              systemInstruction: { parts: [{ text: systemInstruction }] },
            }),
            contents,
            generationConfig: {
              maxOutputTokens: params.maxTokens || 4000,
              temperature: params.temperature || 0.3,
              ...(params.jsonMode && { responseMimeType: "application/json" }),
              ...(model.includes("2.5") && { thinkingConfig: { thinkingBudget: 0 } }),
            },
          }),
          signal: AbortSignal.timeout(50000),
        }
      );

      if (response.status === 429) {
        console.warn(`[ai] Gemini ${model} rate-limited, trying next...`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[ai] Gemini ${model} error ${response.status}:`, errText.slice(0, 200));
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error("[ai] Gemini empty response:", JSON.stringify(data).slice(0, 300));
        continue;
      }

      console.log(`[ai] Gemini ${model} success, length: ${text.length}`);
      return text;
    } catch (err) {
      console.error(`[ai] Gemini ${model} failed:`, err);
      continue;
    }
  }

  return null;
}

async function tryOpenRouter(params: CallParams): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  for (const model of OPENROUTER_MODELS) {
    try {
      console.log(`[ai] Trying OpenRouter ${model}`);
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          max_tokens: params.maxTokens || 4000,
          temperature: params.temperature || 0.3,
          ...(params.jsonMode && { response_format: { type: "json_object" } }),
        }),
        signal: AbortSignal.timeout(50000),
      });

      if (response.status === 429) {
        console.warn(`[ai] OpenRouter ${model} rate-limited, trying next...`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[ai] OpenRouter ${model} error:`, errText.slice(0, 200));
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        console.error("[ai] OpenRouter empty response:", JSON.stringify(data).slice(0, 300));
        continue;
      }

      console.log(`[ai] OpenRouter ${model} success, length: ${text.length}`);
      return text;
    } catch (err) {
      console.error(`[ai] OpenRouter ${model} failed:`, err);
      continue;
    }
  }

  return null;
}

async function callAI(params: CallParams): Promise<string> {
  // Try Gemini first (fast), then OpenRouter (fallback)
  const geminiResult = await tryGemini(params);
  if (geminiResult) return geminiResult;

  console.log("[ai] All Gemini models failed, falling back to OpenRouter...");
  const openRouterResult = await tryOpenRouter(params);
  if (openRouterResult) return openRouterResult;

  throw new Error("All AI providers failed or rate-limited");
}

export async function runResearch(prompt: string): Promise<string> {
  try {
    console.log("[research] Starting...");
    const text = await callAI({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      temperature: 0.3,
    });
    console.log("[research] Done, length:", text.length);
    return text;
  } catch (error) {
    console.error("[research] Failed:", error);
    return "";
  }
}

function extractJson(raw: string): string {
  // Strip markdown code blocks: ```json ... ``` or ``` ... ```
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  if (stripped.startsWith("{")) return stripped;

  // Find the first { and last } to extract JSON object
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw;
}

export async function runAnalysis(
  systemPrompt: string,
  userPrompt: string
): Promise<AnalysisResult> {
  console.log("[analysis] Starting...");
  const content = await callAI({
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
    return JSON.parse(extractJson(content)) as AnalysisResult;
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
