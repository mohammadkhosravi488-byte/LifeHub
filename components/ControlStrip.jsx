"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLifehubData } from "@/lib/data-context";

export default function ControlStrip({
  value,
  onChange,
  showAllTab = true,
  onFilterOpen,
}) {
  const { calendars } = useLifehubData();
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    const base = showAllTab ? [{ id: "all", name: "All" }] : [];
    const unique = new Map(base.concat(calendars).map((cal) => [cal.id, cal]));
    return Array.from(unique.values());
  }, [calendars, showAllTab]);

  const handleSearch = (text) => {
    setSearch(text);
    window.dispatchEvent(new CustomEvent("lifehub:search", { detail: text }));
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 mt-4">
      <div className="h-14 flex items-center justify-between border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Select calendar:</span>
          <div className="flex items-center gap-2">
            {items.map((cal) => {
              const active = value === cal.id || (!value && cal.id === "main");
              return (
                <button
                  key={cal.id}
                  onClick={() => onChange?.(cal.id)}
                  className={`h-8 px-4 rounded-[12px] border text-sm transition ${
                    active
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200"
                      : "border-gray-300 bg-white text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300"
                  }`}
                >
                  {cal.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/import"
            className="h-8 px-3 rounded-[12px] border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
          >
            Import .ics
          </Link>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search…"
            className="w-[320px] h-8 rounded-[12px] border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={onFilterOpen}
            className="h-8 px-3 rounded-[12px] border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
          >
            Filters
          </button>
        </div>
      </div>
    </div>
  );
}
