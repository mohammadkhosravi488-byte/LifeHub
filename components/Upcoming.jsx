"use client";
import { useMemo } from "react";
import { format } from "date-fns";
import { LifehubDataProvider } from "@/lib/data-context";
export default function Upcoming({ events = [] }) {
  const { events, calendars, addEvent, updateEvent, removeEvent } = useLifehubData();
  const visible = useMemo(() => {
    const now = new Date();
    return events
      .filter((ev) => ev.start >= now)
      .sort((a, b) => a.start - b.start)
      .slice(0, 20);
  }, [events]);

  if (!visible.length) {
    return <p className="text-sm text-gray-500">No upcoming events.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
      {visible.map((ev) => {
        const start = ev.start;
        const end = ev.end;
        const timeLabel = ev.allDay
          ? `${format(start, "EEE, MMM d")} • All day`
          : `${format(start, "EEE, MMM d")} • ${format(start, "h:mm a")}${
              end ? ` – ${format(end, "h:mm a")}` : ""
            }`;
        return (
          <li key={ev.id} className="py-3 flex justify-between">
            <div>
              <div className="font-medium">{ev.summary}</div>
              <div className="text-xs text-gray-500">{timeLabel}</div>
            </div>
            <span className="text-xs text-gray-400">{ev.calendarId || "main"}</span>
          </li>
        );
      })}
    </ul>
  );
}
