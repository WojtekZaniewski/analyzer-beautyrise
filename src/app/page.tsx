import AnalysisForm from "@/components/AnalysisForm";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-700 text-sm rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            BeautyRise
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Salon Analyzer
          </h1>
          <p className="text-gray-500 mt-2">
            Kompleksowa analiza AI salonow beauty
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <AnalysisForm />
        </div>
      </div>
    </div>
  );
}
