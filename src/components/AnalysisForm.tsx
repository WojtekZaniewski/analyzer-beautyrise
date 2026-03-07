"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InstagramProfile } from "@/lib/types";
import ProblemChecklist from "./ProblemChecklist";
import InstagramPreview from "./InstagramPreview";
import { Search, ArrowRight, Mail, User, CheckCircle, Loader2, Globe } from "lucide-react";

const formSchema = z.object({
  contactName: z.string().optional(),
  email: z.string().email("Podaj poprawny adres email").optional().or(z.literal("")),
  salonName: z.string().min(1, "Podaj nazwe swojego salonu"),
  websiteUrl: z.string().url("Podaj poprawny adres URL").optional().or(z.literal("")),
  instagramHandle: z.string().min(1, "Wpisz nazwe profilu na Instagramie"),
  problemDescription: z
    .string()
    .min(10, "Napisz kilka slow o swoim salonie (min. 10 znakow)"),
});

type FormData = z.infer<typeof formSchema>;

export default function AnalysisForm() {
  const [problemCategories, setProblemCategories] = useState<string[]>([]);
  const [igProfile, setIgProfile] = useState<InstagramProfile | null>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    setIsSubmitting(true);
    setError(null);

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

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystapil nieoczekiwany blad");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-xl animate-pulse" />
          <Loader2 className="relative w-12 h-12 text-orange-500 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Analizujemy Twoj profil...</h2>
        <p className="text-gray-400 max-w-sm leading-relaxed text-sm">
          Przeprowadzamy doglebne badanie Twojego salonu w internecie. To moze zajac do minuty.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Dziekujemy!</h2>
        <p className="text-gray-500 max-w-md leading-relaxed">
          Nasz zespol wkrotce odezwie sie z pelna analiza Twojego profilu.
          Przygotowujemy dla Ciebie spersonalizowany raport oparty na doglebnym badaniu.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      {error && (
        <div className="p-4 glass-subtle rounded-2xl text-sm text-red-600 border border-red-200/40">
          {error}
        </div>
      )}

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
            Twoje imie
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              {...register("contactName")}
              type="text"
              placeholder="np. Anna"
              className="w-full pl-11 pr-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
            Email
            <span className="text-gray-300 font-normal ml-1">(opcjonalnie)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              {...register("email")}
              type="email"
              placeholder="anna@example.com"
              className="w-full pl-11 pr-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 mt-1.5">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Salon Name */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Nazwa Twojego salonu
        </label>
        <input
          {...register("salonName")}
          type="text"
          placeholder="np. Studio Urody Anna"
          className="w-full px-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300"
        />
        {errors.salonName && (
          <p className="text-sm text-red-500 mt-1.5">{errors.salonName.message}</p>
        )}
      </div>

      {/* Website URL */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Strona internetowa salonu
          <span className="text-gray-300 font-normal ml-1">(opcjonalnie)</span>
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            {...register("websiteUrl")}
            type="url"
            placeholder="https://example.com"
            className="w-full pl-11 pr-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300"
          />
        </div>
        {errors.websiteUrl && (
          <p className="text-sm text-red-500 mt-1.5">{errors.websiteUrl.message}</p>
        )}
      </div>

      {/* Instagram Handle */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Profil Instagram salonu
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
        <p className="text-xs text-gray-400 mt-1.5">Przeanalizujemy Twoj profil automatycznie</p>
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
          Z czym potrzebujesz pomocy?
        </label>
        <ProblemChecklist
          selected={problemCategories}
          onChange={setProblemCategories}
        />
      </div>

      {/* Problem Description */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Opowiedz nam wiecej
        </label>
        <textarea
          {...register("problemDescription")}
          rows={4}
          placeholder="Co chcialabys poprawic w swoim salonie? Jakie sa Twoje cele?"
          className="w-full px-4 py-3 rounded-xl glass-input outline-none text-gray-900 placeholder:text-gray-300 resize-y"
        />
        {errors.problemDescription && (
          <p className="text-sm text-red-500 mt-1.5">
            {errors.problemDescription.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-4 btn-gradient text-white font-semibold rounded-2xl text-base disabled:opacity-60"
      >
        {isSubmitting ? "Wysylanie..." : "Otrzymaj darmowa analize"}
        {!isSubmitting && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}
