import { AnalysisCategory } from "@/lib/types";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface ScoreCardProps {
  category: AnalysisCategory;
}

function getScoreStyle(score: number) {
  if (score >= 7) return { bg: "bg-emerald-50/60", border: "border-emerald-200/40", text: "text-emerald-600", badgeBg: "bg-emerald-500/10" };
  if (score >= 4) return { bg: "bg-amber-50/60", border: "border-amber-200/40", text: "text-amber-600", badgeBg: "bg-amber-500/10" };
  return { bg: "bg-red-50/60", border: "border-red-200/40", text: "text-red-600", badgeBg: "bg-red-500/10" };
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 7) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (score >= 4) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

export default function ScoreCard({ category }: ScoreCardProps) {
  const style = getScoreStyle(category.score);

  return (
    <div className={`rounded-2xl border backdrop-blur-sm ${style.border} ${style.bg} p-6`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900 text-base">{category.name}</h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${style.badgeBg}`}>
          <ScoreIcon score={category.score} />
          <span className={`font-bold text-sm ${style.text}`}>{category.score}/10</span>
        </div>
      </div>

      {category.findings.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Obserwacje
          </p>
          <ul className="space-y-1.5">
            {category.findings.map((finding, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2 leading-relaxed">
                <span className="text-gray-300 shrink-0 mt-0.5">&bull;</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {category.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
            Rekomendacje
          </p>
          <ul className="space-y-1.5">
            {category.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2 leading-relaxed">
                <span className="text-orange-400 shrink-0 mt-0.5">&rarr;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
