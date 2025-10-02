"use client";
import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { LifehubDataProvider } from "@/lib/data-context";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarMonth({ events = [] }) {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const { events, calendars, addEvent, updateEvent, removeEvent } = useLifehubData();
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const today = new Date();

  const dayCells = useMemo(() => {
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    const cells = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const iso = format(d, "yyyy-MM-dd");
      const items = events.filter((ev) =>
        isSameDay(ev.start instanceof Date ? ev.start : new Date(ev.start), d)
      );
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
    <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{format(referenceDate, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <button onClick={() => setReferenceDate(addDays(referenceDate, -30))}>‹</button>
          <button onClick={() => setReferenceDate(new Date())}>Today</button>
          <button onClick={() => setReferenceDate(addDays(referenceDate, 30))}>›</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-xs font-semibold text-gray-500 dark:text-gray-300">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 mt-2">
        {dayCells.map((cell) => (
          <div
            key={cell.iso}
            className={`p-2 rounded-xl border ${
              cell.isToday ? "ring-2 ring-indigo-400" : "border-gray-200 dark:border-neutral-800"
            } ${!cell.inMonth ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between">
              <span>{format(cell.date, "d")}</span>
              {cell.items.length > 0 && (
                <span className="text-xs text-gray-400">{cell.items.length} ev</span>
              )}
            </div>
            <ul className="mt-1 space-y-1">
              {cell.items.slice(0, 3).map((ev) => (
                <li key={ev.id} className="text-xs truncate bg-indigo-50 px-1 rounded">
                  {ev.summary}
                </li>
              ))}
              {cell.items.length > 3 && (
                <li className="text-xs text-indigo-500">+{cell.items.length - 3} more</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
