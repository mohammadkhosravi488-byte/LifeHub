"use client";

import CalendarMonth from "./CalendarMonth";

export default function CalendarYear({
  year,
  calendarFilter = "main",
  selectedCalendarIds = [],
}) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {months.map((d, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            {d.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
          <CalendarMonth
            date={d}
            calendarFilter={calendarFilter}
            selectedCalendarIds={selectedCalendarIds}
          />
        </div>
      ))}
    </div>
  );
}
