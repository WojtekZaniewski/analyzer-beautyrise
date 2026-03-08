import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeInstagram } from "@/lib/instagram";
import { runResearch, runAnalysis } from "@/lib/ai-provider";
import { SYSTEM_PROMPT, buildResearchPrompt, buildUserPrompt } from "@/lib/analysis-prompt";
import { sendFullReportEmail, sendErrorNotificationEmail } from "@/lib/email";
import { scrapeWebsite } from "@/lib/web-scraper";
import { AnalysisReport } from "@/lib/types";

export const maxDuration = 60;

const requestSchema = z.object({
  salonName: z.string().min(1),
  instagramHandle: z.string().min(1),
  problemDescription: z.string().min(10),
  problemCategories: z.array(z.string()),
  websiteUrl: z.string().url().optional().or(z.literal("")),
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

      // Phase 1: Scrape Instagram + web research + website in parallel (all soft-fail)
      const [instagramData, researchResults, websiteContent] = await Promise.all([
        scrapeInstagram(request.instagramHandle).catch((err) => {
          console.error("[analyze] Instagram scrape failed:", err);
          return null;
        }),
        runResearch(buildResearchPrompt(request)).catch((err) => {
          console.error("[analyze] Research failed:", err);
          return "";
        }),
        request.websiteUrl
          ? scrapeWebsite(request.websiteUrl).catch((err) => {
              console.error("[analyze] Website scrape failed:", err);
              return "";
            })
          : Promise.resolve(""),
      ]);

      console.log("[analyze] Phase 1 done. IG:", !!instagramData, "Research length:", researchResults.length, "Website length:", websiteContent.length);

      // Phase 2: AI analysis based on all collected data
      const userPrompt = buildUserPrompt(request, instagramData, researchResults, websiteContent);
      const analysis = await runAnalysis(SYSTEM_PROMPT, userPrompt);

      console.log("[analyze] Phase 2 done. Score:", analysis.executiveSummary.overallScore);

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
      const errMsg = error instanceof Error ? error.message : String(error);
      const errStack = error instanceof Error ? error.stack : undefined;
      console.error("[analyze] Pipeline failed:", errMsg, errStack);
      const is429 = errMsg.includes("429") || errMsg.includes("quota");
      if (!is429) {
        await sendErrorNotificationEmail(request, error).catch((emailErr) =>
          console.error("[analyze] Error email also failed:", emailErr)
        );
      }
      return NextResponse.json(
        {
          error: is429
            ? "Dzienny limit analiz zostal wyczerpany. Sprobuj ponownie jutro."
            : "Wystapil blad podczas analizy. Sprobuj ponownie.",
          debug: errMsg,
        },
        { status: is429 ? 429 : 500 }
      );
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[analyze] Request parse error:", errMsg);
    return NextResponse.json(
      { error: "Wystapil blad podczas analizy. Sprobuj ponownie.", debug: errMsg },
      { status: 500 }
    );
  }
}
