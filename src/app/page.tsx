import AnalysisForm from "@/components/AnalysisForm";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-subtle rounded-full mb-5 text-sm text-orange-700 font-medium">
            <Sparkles className="w-4 h-4 text-orange-500" />
            BeautyRise
          </div>
          <h1 className="text-4xl font-bold text-gradient tracking-tight">
            Darmowa analiza Twojego salonu
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Sprawdz jak Twoj salon wypada online i otrzymaj spersonalizowane rekomendacje w 30 sekund
          </p>
        </div>

        <div className="glass rounded-3xl p-8">
          <AnalysisForm />
        </div>
      </div>
    </div>
  );
}
