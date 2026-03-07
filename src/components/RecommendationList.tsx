import { ActionItem } from "@/lib/types";
import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react";

interface RecommendationListProps {
  items: ActionItem[];
}

const priorityConfig = {
  high: {
    label: "Wysoki",
    icon: ArrowUp,
    bg: "bg-red-50/50",
    badge: "bg-red-500/10 text-red-600",
  },
  medium: {
    label: "Sredni",
    icon: ArrowRight,
    bg: "bg-amber-50/50",
    badge: "bg-amber-500/10 text-amber-600",
  },
  low: {
    label: "Niski",
    icon: ArrowDown,
    bg: "bg-blue-50/50",
    badge: "bg-blue-500/10 text-blue-600",
  },
};

export default function RecommendationList({ items }: RecommendationListProps) {
  const sorted = [...items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => {
        const config = priorityConfig[item.priority];
        const Icon = config.icon;
        return (
          <div
            key={i}
            className={`rounded-2xl border border-white/40 backdrop-blur-sm p-5 ${config.bg}`}
          >
            <div className="flex items-start gap-3">
              <div className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.badge}`}>
                <Icon className="w-3 h-3 inline mr-1" />
                {config.label}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {item.action}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  <span className="font-medium text-gray-500">Obszar:</span> {item.area}
                </p>
                <p className="text-xs text-gray-400">
                  <span className="font-medium text-gray-500">Efekt:</span>{" "}
                  {item.expectedImpact}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
