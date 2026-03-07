import OpenAI from "openai";
import { AnalysisResult } from "./types";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function runAnalysis(
  systemPrompt: string,
  userPrompt: string
): Promise<AnalysisResult> {
  const response = await client.chat.completions.create({
    model: "anthropic/claude-sonnet-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 4000,
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
