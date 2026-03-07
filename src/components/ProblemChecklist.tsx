"use client";

const PROBLEM_OPTIONS = [
  { id: "low-engagement", label: "Chce miec wiecej obserwujacych" },
  { id: "inconsistent-posting", label: "Nie mam czasu na regularne posty" },
  { id: "weak-branding", label: "Moj profil nie wyglada profesjonalnie" },
  { id: "no-target-audience", label: "Nie wiem do kogo kierowac komunikacje" },
  { id: "weak-online-presence", label: "Klienci nie znajduja mnie w internecie" },
  { id: "pricing-issues", label: "Nie wiem czy moje ceny sa odpowiednie" },
  { id: "low-retention", label: "Klienci nie wracaja regularnie" },
  { id: "no-booking-system", label: "Chce usprawnic rezerwacje online" },
  { id: "no-reviews", label: "Mam malo opinii od klientow" },
  { id: "competition", label: "Trudno mi wyroznic sie na tle konkurencji" },
] as const;

interface ProblemChecklistProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function ProblemChecklist({
  selected,
  onChange,
}: ProblemChecklistProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {PROBLEM_OPTIONS.map((option) => (
        <label
          key={option.id}
          className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${
            selected.includes(option.id)
              ? "glass border-orange-300/60 bg-orange-50/60 text-orange-900"
              : "glass-subtle hover:bg-white/60 text-gray-600"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(option.id)}
            onChange={() => toggle(option.id)}
            className="w-4 h-4 text-orange-500 rounded border-gray-300/50 focus:ring-orange-400 accent-orange-500"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
