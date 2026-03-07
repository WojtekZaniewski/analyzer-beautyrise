import { NextResponse, after } from "next/server";
import { z } from "zod";
import { scrapeInstagram } from "@/lib/instagram";
import { runResearch, runAnalysis } from "@/lib/openrouter";
import { SYSTEM_PROMPT, buildResearchPrompt, buildUserPrompt } from "@/lib/analysis-prompt";
import { sendFullReportEmail, sendErrorNotificationEmail } from "@/lib/email";
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

    after(async () => {
      try {
        // Phase 1: Scrape Instagram + web research in parallel
        const [instagramData, researchResults] = await Promise.all([
          scrapeInstagram(request.instagramHandle),
          runResearch(buildResearchPrompt(request)),
        ]);

        // Phase 2: AI analysis based on all collected data
        const userPrompt = buildUserPrompt(request, instagramData, researchResults);
        const analysis = await runAnalysis(SYSTEM_PROMPT, userPrompt);

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
      } catch (error) {
        console.error("Background analysis failed:", error);
        await sendErrorNotificationEmail(request, error).catch(console.error);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Wystapil blad podczas analizy. Sprobuj ponownie." },
      { status: 500 }
    );
  }
}
