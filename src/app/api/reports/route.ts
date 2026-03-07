import { NextResponse } from "next/server";
import { listReports } from "@/lib/storage";

export async function GET() {
  const reports = await listReports();
  return NextResponse.json(reports);
}
