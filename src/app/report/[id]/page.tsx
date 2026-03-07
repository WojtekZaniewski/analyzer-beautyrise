import { getReport } from "@/lib/storage";
import ReportView from "@/components/ReportView";
import { notFound } from "next/navigation";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <ReportView report={report} />
    </div>
  );
}
