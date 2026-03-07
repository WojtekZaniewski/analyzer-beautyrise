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
    const cached = sessionStorage.getItem(`report-${id}`);
    if (cached) {
      try {
        setReport(JSON.parse(cached));
        return;
      } catch {
        // Fall through to API fetch
      }
    }

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-5">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-400 mb-4">Nie znalezlismy tego raportu</p>
          <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
            Wykonaj nowa analize
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-xl animate-pulse" />
          <Loader2 className="relative w-10 h-10 text-orange-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <ReportView report={report} />
    </div>
  );
}
