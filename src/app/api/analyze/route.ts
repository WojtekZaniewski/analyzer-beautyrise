import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeInstagram } from "@/lib/instagram";
import { runResearch, runAnalysis } from "@/lib/openrouter";
import { SYSTEM_PROMPT, buildResearchPrompt, buildUserPrompt } from "@/lib/analysis-prompt";
import { sendFullReportEmail, sendErrorNotificationEmail } from "@/lib/email";
import { AnalysisReport } from "@/lib/types";

export const maxDuration = 60;

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

    try {
      console.log("[analyze] Starting pipeline for:", request.salonName);

      // Phase 1: Scrape Instagram + web research in parallel (both soft-fail)
      const [instagramData, researchResults] = await Promise.all([
        scrapeInstagram(request.instagramHandle).catch((err) => {
          console.error("[analyze] Instagram scrape failed:", err);
          return null;
        }),
        runResearch(buildResearchPrompt(request)).catch((err) => {
          console.error("[analyze] Research failed:", err);
          return "";
        }),
      ]);

      console.log("[analyze] Phase 1 done. IG:", !!instagramData, "Research length:", researchResults.length);

      // Phase 2: AI analysis based on all collected data
      const userPrompt = buildUserPrompt(request, instagramData, researchResults);
      const analysis = await runAnalysis(SYSTEM_PROMPT, userPrompt);

      console.log("[analyze] Phase 2 done. Score:", analysis.overallScore);

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

      await sendFullReportEmail(report, researchResults);
      console.log("[analyze] Email sent successfully");

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[analyze] Pipeline failed:", error);
      await sendErrorNotificationEmail(request, error).catch((emailErr) =>
        console.error("[analyze] Error email also failed:", emailErr)
      );
      return NextResponse.json(
        { error: "Wystapil blad podczas analizy. Sprobuj ponownie." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[analyze] Request parse error:", error);
    return NextResponse.json(
      { error: "Wystapil blad podczas analizy. Sprobuj ponownie." },
      { status: 500 }
    );
  }
}
