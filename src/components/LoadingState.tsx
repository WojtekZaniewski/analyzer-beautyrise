"use client";

import { Loader2 } from "lucide-react";

const STEPS = [
  "Pobieranie danych z Instagrama...",
  "Analiza profilu i contentu...",
  "Generowanie raportu AI...",
  "Finalizacja rekomendacji...",
];

interface LoadingStateProps {
  step?: number;
}

export default function LoadingState({ step = 0 }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-xl animate-pulse" />
        <Loader2 className="relative w-14 h-14 text-orange-500 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-xl font-semibold text-gray-900">
          Analizujemy salon...
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {STEPS[Math.min(step, STEPS.length - 1)]}
        </p>
      </div>
      <div className="flex gap-2.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              i <= step
                ? "bg-gradient-to-r from-orange-500 to-amber-400 scale-110"
                : "bg-gray-200/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
