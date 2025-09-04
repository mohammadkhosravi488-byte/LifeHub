"use client";

import { useMemo } from "react";

function getMonthMatrix(baseDate = new Date()) {
  // Build a 6x7 grid (Sun–Sat). Keep it simple & safe.
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const startDay = new Date(d);
  // shift to previous Sunday
  startDay.setDate(d.getDate() - d.getDay());

  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + w * 7 + i);
      days.push(day);
    }
    weeks.push(days);
  }
  return weeks;
}

export default function CalendarMonth({
  date = new Date(),
  calendarFilter = "main",
  selectedCalendarIds = [],
  search = "",
}) {
  const matrix = useMemo(() => getMonthMatrix(date), [date]);
  const monthIndex = date.getMonth();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-800">
          {date.toLocaleString(undefined, { month: "long", year: "numeric" })} • Month
        </h2>
        <div className="text-sm text-gray-500">
          Filter: {calendarFilter} {selectedCalendarIds?.length ? `(+${selectedCalendarIds.length} more)` : ""}
          {search ? ` • “${search}”` : ""}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-xs font-semibold text-gray-500 text-center">{d}</div>
        ))}
        {matrix.flat().map((day, idx) => {
          const isOtherMonth = day.getMonth() !== monthIndex;
          return (
            <div
              key={idx}
              className={[
                "min-h-24 h-24 border rounded-lg p-2 overflow-hidden",
                isOtherMonth ? "bg-gray-50 border-gray-200 text-gray-400" : "bg-white border-gray-200",
              ].join(" ")}
            >
              <div className="text-xs font-semibold">{day.getDate()}</div>
              {/* TODO: render month events here */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
