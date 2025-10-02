"use client";

import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameDay,
} from "date-fns";
import { useLifehubData } from "@/lib/data-context";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarMonth({ currentDate = new Date() }) {
  const [referenceDate, setReferenceDate] = useState(currentDate);
  const { events } = useLifehubData();
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const today = new Date();

  const dayCells = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const cells = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const iso = format(d, "yyyy-MM-dd");
      const items = events.filter((ev) => {
        const start = ev.start?.toDate ? ev.start.toDate() : new Date(ev.start);
        return isSameDay(start, d);
      });
      cells.push({
        date: d,
        iso,
        inMonth: d.getMonth() === monthStart.getMonth(),
        items,
        isToday: isSameDay(d, today),
      });
    }
    return cells;
  }, [referenceDate, events]);

  return (
    <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          {format(referenceDate, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setReferenceDate(addMonths(referenceDate, -1))}
            className="px-2 py-1 rounded-md border bg-white dark:bg-neutral-800 text-sm hover:bg-gray-100 dark:hover:bg-neutral-700"
          >
            ‹
          </button>
          <button
            onClick={() => setReferenceDate(new Date())}
            className="px-2 py-1 rounded-md border bg-white dark:bg-neutral-800 text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            Today
          </button>
          <button
            onClick={() => setReferenceDate(addMonths(referenceDate, 1))}
            className="px-2 py-1 rounded-md border bg-white dark:bg-neutral-800 text-sm hover:bg-gray-100 dark:hover:bg-neutral-700"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekdays header */}
      <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 dark:text-gray-300 border-t border-gray-200 dark:border-neutral-800">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-center uppercase tracking-wide">
            {w}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 border-t border-gray-200 dark:border-neutral-800 text-sm">
        {dayCells.map((cell, idx) => (
          <div
            key={cell.iso}
            className={`h-28 p-1 border border-gray-200 dark:border-neutral-800 relative overflow-hidden ${
              !cell.inMonth ? "bg-gray-50 dark:bg-neutral-900/50 text-gray-400" : ""
            }`}
          >
            {/* Day number */}
            <div
              className={`absolute top-1 right-1 text-xs font-medium ${
                cell.isToday ? "bg-indigo-500 text-white px-2 rounded-full" : ""
              }`}
            >
              {format(cell.date, "d")}
            </div>

            {/* Events */}
            <div className="mt-5 space-y-0.5">
              {cell.items.slice(0, 2).map((ev) => (
                <div
                  key={ev.id}
                  className="truncate rounded px-1 text-[11px] leading-4 font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40"
                  title={ev.summary}
                >
                  {ev.summary}
                </div>
              ))}
              {cell.items.length > 2 && (
                <div className="text-[11px] text-indigo-500 dark:text-indigo-400">
                  +{cell.items.length - 2} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
