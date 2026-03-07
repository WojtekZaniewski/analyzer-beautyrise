"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { InstagramProfile, AnalysisReport } from "@/lib/types";
import ProblemChecklist from "./ProblemChecklist";
import InstagramPreview from "./InstagramPreview";
import LoadingState from "./LoadingState";
import { Search, Send } from "lucide-react";

const formSchema = z.object({
  salonName: z.string().min(1, "Podaj nazwe salonu"),
  instagramHandle: z.string().min(1, "Podaj handle Instagram"),
  problemDescription: z
    .string()
    .min(10, "Opis problemu musi miec minimum 10 znakow"),
  additionalNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AnalysisForm() {
  const router = useRouter();
  const [problemCategories, setProblemCategories] = useState<string[]>([]);
  const [igProfile, setIgProfile] = useState<InstagramProfile | null>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const fetchInstagram = async () => {
    const handle = getValues("instagramHandle");
    if (!handle) return;

    setIgLoading(true);
    setIgProfile(null);
    try {
      const res = await fetch("/api/scrape-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      if (res.ok) {
        const data = await res.json();
        setIgProfile(data);
      }
    } catch {
      // Silent fail - IG preview is optional
    } finally {
      setIgLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsAnalyzing(true);
    setError(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 3));
    }, 5000);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          problemCategories,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Blad analizy");
      }

      const report: AnalysisReport = await res.json();
      router.push(`/report/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystapil nieoczekiwany blad");
      setIsAnalyzing(false);
    } finally {
      clearInterval(stepInterval);
    }
  };

  if (isAnalyzing) {
    return <LoadingState step={loadingStep} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Salon Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nazwa salonu *
        </label>
        <input
          {...register("salonName")}
          type="text"
          placeholder="np. Beauty Studio Anna"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
        />
        {errors.salonName && (
          <p className="text-sm text-red-500 mt-1">{errors.salonName.message}</p>
        )}
      </div>

      {/* Instagram Handle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instagram *
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              @
            </span>
            <input
              {...register("instagramHandle")}
              type="text"
              placeholder="nazwa_profilu"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={fetchInstagram}
            disabled={igLoading}
            className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {igLoading ? "Szukam..." : "Podglad"}
          </button>
        </div>
        {errors.instagramHandle && (
          <p className="text-sm text-red-500 mt-1">
            {errors.instagramHandle.message}
          </p>
        )}
        {igProfile && (
          <div className="mt-3">
            <InstagramPreview profile={igProfile} />
          </div>
        )}
      </div>

      {/* Problem Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kategorie problemow
        </label>
        <ProblemChecklist
          selected={problemCategories}
          onChange={setProblemCategories}
        />
      </div>

      {/* Problem Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opis problemu *
        </label>
        <textarea
          {...register("problemDescription")}
          rows={4}
          placeholder="Opisz szczegolowo problem salonu, z czym sie zmaga, co chce osiagnac..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-y"
        />
        {errors.problemDescription && (
          <p className="text-sm text-red-500 mt-1">
            {errors.problemDescription.message}
          </p>
        )}
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dodatkowe uwagi
        </label>
        <textarea
          {...register("additionalNotes")}
          rows={2}
          placeholder="Opcjonalne dodatkowe informacje..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-y"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
      >
        <Send className="w-4 h-4" />
        Analizuj salon
      </button>
    </form>
  );
}
