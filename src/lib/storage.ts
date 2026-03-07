import { AnalysisReport } from "./types";

// In-memory storage - works on Vercel serverless (ephemeral, resets on cold start)
const reports = new Map<string, AnalysisReport>();

export async function saveReport(report: AnalysisReport): Promise<string> {
  reports.set(report.id, report);
  return report.id;
}

export async function getReport(id: string): Promise<AnalysisReport | null> {
  return reports.get(id) ?? null;
}

export async function listReports(): Promise<AnalysisReport[]> {
  return Array.from(reports.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
