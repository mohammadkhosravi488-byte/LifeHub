"use client";

import { useEffect, useMemo } from "react";
import { useLifehubData } from "@/lib/data-context";

export default function CalendarTabs({ value, onChange, onCalendarsDiscovered }) {
  const { calendars } = useLifehubData();

  const items = useMemo(() => {
    const base = [
      { id: "all", name: "All" },
      { id: "main", name: "Main" },
    ];

    const extras = calendars
      .filter((cal) => cal.id !== "main")
      .map((cal) => ({ id: cal.id, name: cal.name }));

    const unique = new Map(base.concat(extras).map((cal) => [cal.id, cal]));
    return Array.from(unique.values());
  }, [calendars]);

  useEffect(() => {
    if (!onCalendarsDiscovered) return;
    onCalendarsDiscovered(items.filter((cal) => cal.id !== "all"));
  }, [items, onCalendarsDiscovered]);

  return (
    <div className="flex gap-2">
      {items.map((cal) => (
        <button
          key={cal.id}
          onClick={() => onChange(cal.id)}
          className={[
            "px-3 h-8 rounded-full border text-sm",
            value === cal.id
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500"
              : "border-gray-300 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-200",
          ].join(" ")}
        >
          {cal.name}
        </button>
      ))}
    </div>
  );
}
