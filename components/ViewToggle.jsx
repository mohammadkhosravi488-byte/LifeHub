"use client";

export default function ViewToggle({ mode, onCycle }) {
  const label = mode === "day" ? "Month" : mode === "month" ? "Year" : "Day";
  return (
    <button
      type="button"
      onClick={onCycle}
      className="h-8 px-4 rounded-full border border-gray-300 bg-white text-sm font-semibold hover:shadow-sm"
      aria-label="Cycle calendar view"
      title={`Switch to ${label} view`}
    >
      {label} view
    </button>
  );
}
