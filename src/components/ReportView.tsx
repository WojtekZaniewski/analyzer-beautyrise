"use client";

import { AnalysisReport } from "@/lib/types";
import ScoreCard from "./ScoreCard";
import RecommendationList from "./RecommendationList";
import InstagramPreview from "./InstagramPreview";
import { Calendar, Instagram, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ReportViewProps {
  report: AnalysisReport;
}

function getOverallScoreStyle(score: number) {
  if (score >= 7) return "text-emerald-600 border-emerald-300/50 bg-emerald-50/60";
  if (score >= 4) return "text-amber-600 border-amber-300/50 bg-amber-50/60";
  return "text-red-600 border-red-300/50 bg-red-50/60";
}

export default function ReportView({ report }: ReportViewProps) {
  const { analysis } = report;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-orange-600 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Powrot do formularza
      </Link>

      {/* Header */}
      <div className="glass rounded-3xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {report.salonName}
            </h1>
            <div className="flex items-center gap-5 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-orange-400" />@{report.instagramHandle}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-400" />
                {new Date(report.createdAt).toLocaleDateString("pl-PL")}
              </span>
            </div>
          </div>
          <div
            className={`flex items-center justify-center w-22 h-22 rounded-full border-4 backdrop-blur-sm ${getOverallScoreStyle(analysis.overallScore)}`}
            style={{ width: "5.5rem", height: "5.5rem" }}
          >
            <span className="text-3xl font-bold">{analysis.overallScore}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-5 glass-subtle rounded-2xl">
          <p className="text-sm text-gray-600 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Problem description */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Zgloszony problem
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{report.problemDescription}</p>
          {report.problemCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {report.problemCategories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 bg-orange-50/80 text-orange-600 text-xs rounded-full font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instagram Data */}
      {report.instagramData && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
            Dane z Instagrama
          </h2>
          <InstagramPreview profile={report.instagramData} />
        </div>
      )}

      {/* Category Scores */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
          Analiza szczegolowa
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {analysis.categories.map((category, i) => (
            <ScoreCard key={i} category={category} />
          ))}
        </div>
      </div>

      {/* Action Plan */}
      {analysis.actionPlan.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
            Plan dzialania
          </h2>
          <RecommendationList items={analysis.actionPlan} />
        </div>
      )}
    </div>
  );
}
