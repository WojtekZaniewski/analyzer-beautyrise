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

function getOverallScoreColor(score: number) {
  if (score >= 7) return "text-emerald-600 border-emerald-300 bg-emerald-50";
  if (score >= 4) return "text-amber-600 border-amber-300 bg-amber-50";
  return "text-red-600 border-red-300 bg-red-50";
}

export default function ReportView({ report }: ReportViewProps) {
  const { analysis } = report;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Powrot do formularza
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {report.salonName}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Instagram className="w-4 h-4" />@{report.instagramHandle}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(report.createdAt).toLocaleDateString("pl-PL")}
              </span>
            </div>
          </div>
          <div
            className={`flex items-center justify-center w-20 h-20 rounded-full border-4 ${getOverallScoreColor(analysis.overallScore)}`}
          >
            <span className="text-2xl font-bold">{analysis.overallScore}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{analysis.summary}</p>
        </div>

        {/* Problem description */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Zgloszony problem
          </p>
          <p className="text-sm text-gray-700">{report.problemDescription}</p>
          {report.problemCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {report.problemCategories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 bg-rose-50 text-rose-700 text-xs rounded-full"
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
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Dane z Instagrama
          </h2>
          <InstagramPreview profile={report.instagramData} />
        </div>
      )}

      {/* Category Scores */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
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
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Plan dzialania
          </h2>
          <RecommendationList items={analysis.actionPlan} />
        </div>
      )}
    </div>
  );
}
