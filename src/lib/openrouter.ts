import OpenAI from "openai";
import { AnalysisResult } from "./types";

function getClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

export async function runResearch(prompt: string): Promise<string> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 6000,
        temperature: 0.3,
        plugins: [{ id: "web", max_results: 10 }],
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "no body");
      console.error("Research API error:", response.status, errorBody);
      // Fallback: run without plugins
      return await runResearchFallback(prompt);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    console.error("Research failed, using fallback:", error);
    return await runResearchFallback(prompt);
  }
}

async function runResearchFallback(prompt: string): Promise<string> {
  try {
    const response = await getClient().chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 6000,
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (error) {
    console.error("Research fallback also failed:", error);
    return "";
  }
}

export async function runAnalysis(
  systemPrompt: string,
  userPrompt: string
): Promise<AnalysisResult> {
  const response = await getClient().chat.completions.create({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 8000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

  try {
    return JSON.parse(jsonStr) as AnalysisResult;
  } catch {
    // Fallback: return a basic result with raw text
    return {
      overallScore: 0,
      summary: content,
      categories: [],
      actionPlan: [],
    };
  }
}
