import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult } from "./types";

function getClient() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

export async function runResearch(prompt: string): Promise<string> {
  try {
    const model = getClient().getGenerativeModel({
      model: "gemini-2.5-flash",
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

export async function runAnalysis(
  systemPrompt: string,
  userPrompt: string
): Promise<AnalysisResult> {
  const model = getClient().getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 4000,
      temperature: 0.3,
    },
  });

  const result = await model.generateContent(userPrompt);
  const content = result.response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

  try {
    return JSON.parse(jsonStr) as AnalysisResult;
  } catch {
    return {
      overallScore: 0,
      summary: content,
      categories: [],
      actionPlan: [],
    };
  }
}
