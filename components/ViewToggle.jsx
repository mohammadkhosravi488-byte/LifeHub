"use client";

export default function ViewToggle({ value, mode, onChange, onCycle }) {
  const current = value ?? mode ?? "day";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange?.("day")}
        className={[
          "h-8 px-3 rounded-full border text-sm",
          current === "day"
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 bg-white",
        ].join(" ")}
        aria-pressed={current === "day"}
      >
        Day
      </button>
      <button
        type="button"
        onClick={() => onChange?.("month")}
        className={[
          "h-8 px-3 rounded-full border text-sm",
          current === "month"
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 bg-white",
        ].join(" ")}
        aria-pressed={current === "month"}
      >
        Month
      </button>
      <button
        type="button"
        onClick={() => onChange?.("year")}
        className={[
          "h-8 px-3 rounded-full border text-sm",
          current === "year"
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 bg-white",
        ].join(" ")}
        aria-pressed={current === "year"}
      >
        Year
      </button>

      <button
        type="button"
        onClick={() => onCycle?.()}
        className="h-8 px-3 rounded-full border border-gray-300 bg-white text-sm"
        title="Cycle Day → Month → Year"
        aria-label="Cycle view"
      >
        ⟳
      </button>
    </div>
  );
}
