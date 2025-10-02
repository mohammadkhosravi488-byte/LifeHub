"use client";

import { useState, useMemo } from "react";
import { useLifehubData } from "@/lib/data-context";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameDay,
  isSameMonth,
} from "date-fns";

export default function CalendarYear({ currentDate = new Date() }) {
  const [year, setYear] = useState(currentDate.getFullYear());
  const { events } = useLifehubData();
  const today = new Date();

  // Normalize Firestore Timestamps
  const normalizeDate = (val) => {
    if (!val) return null;
    if (val.toDate) return val.toDate();
    if (val instanceof Date) return val;
    return new Date(val);
  };

  // Preprocess events into a map by day string
  const eventMap = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const start = normalizeDate(ev.start);
      if (!start || start.getFullYear() !== year) return;
      const key = format(start, "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events, year]);

  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setYear(year - 1)}
          className="px-3 py-1 rounded-md border bg-white dark:bg-neutral-800 text-sm hover:bg-gray-100 dark:hover:bg-neutral-700"
        >
          ‹
        </button>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {year}
        </h2>
        <button
          onClick={() => setYear(year + 1)}
          className="px-3 py-1 rounded-md border bg-white dark:bg-neutral-800 text-sm hover:bg-gray-100 dark:hover:bg-neutral-700"
        >
          ›
        </button>
      </div>

      {/* Grid of months */}
      <div className="grid grid-cols-3 gap-6">
        {months.map((monthDate) => (
          <MiniMonth
            key={monthDate.toISOString()}
            date={monthDate}
            today={today}
            eventMap={eventMap}
          />
        ))}
      </div>
    </div>
  );
}

function MiniMonth({ date, today, eventMap }) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const start = startOfWeek(monthStart, { weekStartsOn: 0 });
  const end = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const iso = format(d, "yyyy-MM-dd");
    days.push({
      date: d,
      iso,
      inMonth: isSameMonth(d, monthStart),
      isToday: isSameDay(d, today),
      hasEvents: !!eventMap[iso],
    });
  }

  return (
    <div className="p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/30 shadow-sm">
      <div className="text-center font-semibold text-gray-800 dark:text-gray-100 mb-2">
        {format(date, "MMMM")}
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-[10px] text-gray-500 dark:text-gray-400 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
  <div key={`${d}-${i}`} className="text-center">
    {d}
  </div>
))}

      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-[2px] text-[10px]">
        {days.map((d) => (
          <div
            key={d.iso}
            className={`h-6 w-6 flex items-center justify-center rounded-full relative ${
              !d.inMonth ? "opacity-40" : ""
            } ${d.isToday ? "bg-indigo-500 text-white font-bold" : "text-gray-700 dark:text-gray-200"}`}
          >
            {format(d.date, "d")}
            {d.hasEvents && (
              <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400"></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
