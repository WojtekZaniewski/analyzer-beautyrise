"use client";

const PROBLEM_OPTIONS = [
  { id: "low-engagement", label: "Niski engagement / malo followerow" },
  { id: "inconsistent-posting", label: "Niespojne postowanie" },
  { id: "weak-branding", label: "Slaby branding wizualny" },
  { id: "no-target-audience", label: "Brak jasnej grupy docelowej" },
  { id: "weak-online-presence", label: "Slaba obecnosc online" },
  { id: "pricing-issues", label: "Problemy z cenami" },
  { id: "low-retention", label: "Niska retencja klientow" },
  { id: "no-booking-system", label: "Brak systemu rezerwacji" },
  { id: "no-reviews", label: "Brak opinii / testimoniali" },
  { id: "competition", label: "Presja konkurencji" },
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
