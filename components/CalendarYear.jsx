"use client";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, isSameDay, addMonths } from "date-fns";

export default function CalendarYear({ events = [] }) {
  const [year, setYear] = useState(new Date().getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(year, i, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const count = events.filter(
      (ev) => ev.start >= start && ev.start <= end
    ).length;
    return { date, count };
  });

  return (
    <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5">
      <div className="flex justify-between items-center">
        <button onClick={() => setYear(year - 1)}>‹</button>
        <h2 className="text-2xl font-semibold">{year}</h2>
        <button onClick={() => setYear(year + 1)}>›</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {months.map((m) => (
          <div key={m.date.toISOString()} className="p-4 border rounded-xl">
            <div className="font-semibold">{format(m.date, "MMMM")}</div>
            <div className="text-sm text-gray-500">{m.count} events</div>
          </div>
        ))}
      </div>
    </div>
  );
}
