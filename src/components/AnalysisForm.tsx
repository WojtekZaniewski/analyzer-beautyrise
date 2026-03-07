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
      sessionStorage.setItem(`report-${report.id}`, JSON.stringify(report));
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      {error && (
        <div className="p-4 glass-subtle rounded-2xl text-sm text-red-600 border border-red-200/40">
          {error}
        </div>
      )}

      {/* Salon Name */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Nazwa salonu
        </label>
        <input
          {...register("salonName")}
          type="text"
          placeholder="np. Beauty Studio Anna"
          className="w-full px-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300"
        />
        {errors.salonName && (
          <p className="text-sm text-red-500 mt-1.5">{errors.salonName.message}</p>
        )}
      </div>

      {/* Instagram Handle */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Instagram
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 font-medium">
              @
            </span>
            <input
              {...register("instagramHandle")}
              type="text"
              placeholder="nazwa_profilu"
              className="w-full pl-9 pr-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300"
            />
          </div>
          <button
            type="button"
            onClick={fetchInstagram}
            disabled={igLoading}
            className="px-5 py-3 glass-subtle rounded-xl hover:bg-white/70 transition-all disabled:opacity-50 flex items-center gap-2 text-gray-600 font-medium text-sm"
          >
            <Search className="w-4 h-4" />
            {igLoading ? "Szukam..." : "Podglad"}
          </button>
        </div>
        {errors.instagramHandle && (
          <p className="text-sm text-red-500 mt-1.5">
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
        <label className="block text-sm font-medium text-gray-600 mb-3 tracking-wide">
          Kategorie problemow
        </label>
        <ProblemChecklist
          selected={problemCategories}
          onChange={setProblemCategories}
        />
      </div>

      {/* Problem Description */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Opis problemu
        </label>
        <textarea
          {...register("problemDescription")}
          rows={4}
          placeholder="Opisz szczegolowo problem salonu, z czym sie zmaga, co chce osiagnac..."
          className="w-full px-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300 resize-y"
        />
        {errors.problemDescription && (
          <p className="text-sm text-red-500 mt-1.5">
            {errors.problemDescription.message}
          </p>
        )}
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Dodatkowe uwagi
        </label>
        <textarea
          {...register("additionalNotes")}
          rows={2}
          placeholder="Opcjonalne dodatkowe informacje..."
          className="w-full px-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300 resize-y"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 btn-gradient text-white font-semibold rounded-2xl text-base"
      >
        <Send className="w-4 h-4" />
        Analizuj salon
      </button>
    </form>
  );
}
