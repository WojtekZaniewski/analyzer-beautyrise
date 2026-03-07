import { ActionItem } from "@/lib/types";
import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react";

interface RecommendationListProps {
  items: ActionItem[];
}

const priorityConfig = {
  high: {
    label: "Wysoki",
    icon: ArrowUp,
    bg: "bg-red-50",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700",
  },
  medium: {
    label: "Sredni",
    icon: ArrowRight,
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
  },
  low: {
    label: "Niski",
    icon: ArrowDown,
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
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
            className={`rounded-lg border border-gray-200 p-4 ${config.bg}`}
          >
            <div className="flex items-start gap-3">
              <div className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${config.badge}`}>
                <Icon className="w-3 h-3 inline mr-1" />
                {config.label}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {item.action}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">Obszar:</span> {item.area}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Efekt:</span>{" "}
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
