import { NextResponse } from "next/server";
import { getReport } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return NextResponse.json(
      { error: "Raport nie znaleziony" },
      { status: 404 }
    );
  }

  return NextResponse.json(report);
}
