"use client";
import { LifehubDataProvider } from "@/lib/data-context";
export default function ViewToggle({ value, onChange, onCycle }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange?.("day")}
        className={[
          "h-8 px-3 rounded-full border text-sm",
          value === "day" ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-white",
        ].join(" ")}
        aria-pressed={value === "day"}
      >
        Day
      </button>
      <button
        type="button"
        onClick={() => onChange?.("month")}
        className={[
          "h-8 px-3 rounded-full border text-sm",
          value === "month" ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-white",
        ].join(" ")}
        aria-pressed={value === "month"}
      >
        Month
      </button>
      <button
        type="button"
        onClick={() => onChange?.("year")}
        className={[
          "h-8 px-3 rounded-full border text-sm",
          value === "year" ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-white",
        ].join(" ")}
        aria-pressed={value === "year"}
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
