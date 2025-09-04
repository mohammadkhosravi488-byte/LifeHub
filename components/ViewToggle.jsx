"use client";

export default function ViewToggle({ mode = "day", onChange, onCycle }) {
  const Btn = (key, label) => {
    const active = mode === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange?.(key)}
        className={[
          "h-8 px-4 rounded-full border text-sm font-semibold transition",
          active
            ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        ].join(" ")}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {Btn("day", "Day")}
      {Btn("month", "Month")}
      {Btn("year", "Year")}
      <button
        type="button"
        onClick={() => onCycle?.()}
        className="h-8 px-3 rounded-full border border-gray-300 bg-white text-sm hover:bg-gray-50"
        title="Cycle views (Day → Month → Year)"
        aria-label="Cycle views"
      >
        ⟳
      </button>
    </div>
  );
}
