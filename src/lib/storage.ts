import { promises as fs } from "fs";
import path from "path";
import { AnalysisReport } from "./types";

const DATA_DIR = path.join(process.cwd(), "src", "data");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveReport(report: AnalysisReport): Promise<string> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${report.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(report, null, 2), "utf-8");
  return report.id;
}

export async function getReport(id: string): Promise<AnalysisReport | null> {
  // Sanitize ID to prevent path traversal
  const safeId = path.basename(id).replace(/[^a-zA-Z0-9-]/g, "");
  const filePath = path.join(DATA_DIR, `${safeId}.json`);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as AnalysisReport;
  } catch {
    return null;
  }
}

export async function listReports(): Promise<AnalysisReport[]> {
  await ensureDataDir();
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const reports = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
        return JSON.parse(content) as AnalysisReport;
      })
    );

    return reports.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}
