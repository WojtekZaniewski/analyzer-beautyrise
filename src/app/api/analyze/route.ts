import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeInstagram } from "@/lib/instagram";
import { runAnalysis } from "@/lib/openrouter";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/analysis-prompt";
import { saveReport } from "@/lib/storage";
import { AnalysisReport } from "@/lib/types";

const requestSchema = z.object({
  salonName: z.string().min(1),
  instagramHandle: z.string().min(1),
  problemDescription: z.string().min(10),
  problemCategories: z.array(z.string()),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidlowe dane formularza", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const request = parsed.data;

    // Scrape Instagram (non-blocking failure)
    const instagramData = await scrapeInstagram(request.instagramHandle);

    // Build prompt and run AI analysis
    const userPrompt = buildUserPrompt(request, instagramData);
    const analysis = await runAnalysis(SYSTEM_PROMPT, userPrompt);

    // Assemble report
    const report: AnalysisReport = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      salonName: request.salonName,
      instagramHandle: request.instagramHandle,
      problemDescription: request.problemDescription,
      problemCategories: request.problemCategories,
      contactName: request.contactName || undefined,
      email: request.email || undefined,
      instagramData,
      analysis,
    };

    // Save report
    await saveReport(report);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Wystapil blad podczas analizy. Sprobuj ponownie." },
      { status: 500 }
    );
  }
}
