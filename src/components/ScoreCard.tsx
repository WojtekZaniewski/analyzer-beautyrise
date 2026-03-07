import { AnalysisCategory } from "@/lib/types";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ScoreCardProps {
  category: AnalysisCategory;
}

function getScoreColor(score: number) {
  if (score >= 7) return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100" };
  if (score >= 4) return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100" };
  return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100" };
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 7) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (score >= 4) return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  return <XCircle className="w-5 h-5 text-red-500" />;
}

export default function ScoreCard({ category }: ScoreCardProps) {
  const colors = getScoreColor(category.score);

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{category.name}</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${colors.badge}`}>
          <ScoreIcon score={category.score} />
          <span className={`font-bold ${colors.text}`}>{category.score}/10</span>
        </div>
      </div>

      {category.findings.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Obserwacje
          </p>
          <ul className="space-y-1">
            {category.findings.map((finding, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-gray-400 shrink-0">&bull;</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {category.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Rekomendacje
          </p>
          <ul className="space-y-1">
            {category.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-rose-400 shrink-0">&rarr;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
