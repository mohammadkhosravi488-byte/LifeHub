"use client";

import { useMemo } from "react";

/**
 * CalendarTabs
 * - Shows only "Main" by default.
 * - If you later pass extra calendars (Family / Study / Assessments), they’ll appear.
 * - Calls onChange(value) when a tab is clicked.
 */
export default function CalendarTabs({
  value = "main",
  onChange = () => {},
  calendars = [], // optional: [{id:"family", name:"Family"}, ...]
}) {
  // Ensure we always have "Main" first
  const tabs = useMemo(() => {
    const base = [{ id: "main", name: "Main" }];
    const extras = (calendars || [])
      .filter((c) => c && c.id && c.id !== "main")
      .map((c) => ({ id: c.id, name: c.name || c.id }));
    return [...base, ...extras];
  }, [calendars]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-600">Select Calendar:</span>
      <div className="flex items-center gap-2">
        {tabs.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={[
                "h-8 px-4 rounded-xl border text-sm transition",
                active
                  ? "bg-white border-gray-300 font-semibold text-gray-900 shadow-sm"
                  : "bg-white border-gray-300 text-gray-500 hover:text-gray-700",
              ].join(" ")}
              aria-pressed={active}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
