"use client";
import { format } from "date-fns";
import { LifehubDataProvider } from "@/lib/data-context";
export default function CalendarDay({ currentDate = new Date() }) {
  const { events, calendars, addEvent, updateEvent, removeEvent } = useLifehubData();
  const dayLabel = format(currentDate, "EEEE, MMMM d"); // e.g. Thursday, October 2

  return (
    <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{dayLabel}</h2>

      <div className="divide-y divide-gray-200 dark:divide-neutral-800">
        {events.length === 0 && (
          <p className="text-sm text-gray-500">No events scheduled for this day.</p>
        )}
        {events.map((ev) => {
          const start = ev.start instanceof Date ? ev.start : new Date(ev.start);
          const end = ev.end instanceof Date ? ev.end : ev.end ? new Date(ev.end) : null;
          const timeLabel = ev.allDay
            ? "All day"
            : `${format(start, "h:mm a")}${end ? ` – ${format(end, "h:mm a")}` : ""}`;

          return (
            <div key={ev.id} className="py-3 flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{ev.summary}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{timeLabel}</div>
                {ev.location && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">📍 {ev.location}</div>
                )}
              </div>
              <span className="text-xs text-gray-400">{ev.calendarId || "main"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
