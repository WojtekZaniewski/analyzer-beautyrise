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
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">
          Analizujemy salon...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {STEPS[Math.min(step, STEPS.length - 1)]}
        </p>
      </div>
      <div className="flex gap-2 mt-4">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= step ? "bg-rose-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
