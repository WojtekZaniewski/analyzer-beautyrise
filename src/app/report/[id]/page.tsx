"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReportView from "@/components/ReportView";
import { AnalysisReport } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Try sessionStorage first (set by AnalysisForm after analysis)
    const cached = sessionStorage.getItem(`report-${id}`);
    if (cached) {
      try {
        setReport(JSON.parse(cached));
        return;
      } catch {
        // Fall through to API fetch
      }
    }

    // Fallback: fetch from API
    fetch(`/api/reports/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setReport)
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Raport nie znaleziony</p>
        <Link href="/" className="text-rose-600 hover:underline">
          Powrot do formularza
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <ReportView report={report} />
    </div>
  );
}
