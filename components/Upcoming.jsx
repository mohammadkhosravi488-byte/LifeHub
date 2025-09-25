"use client";

import { useMemo } from "react";
import { useLifehubData } from "@/lib/data-context";

export default function Upcoming({
  calendarFilter = "all",
  search = "",
  selectedCalendarIds = [],
}) {
  const { events } = useLifehubData();

  const visible = useMemo(() => {
    const now = new Date();
    const text = search.trim().toLowerCase();
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;

    return events
      .filter((event) => {
        const start = event.start instanceof Date ? event.start : new Date(event.start);
        if (start < now) return false;
        const calId = event.calendarId || "main";
        if (calendarFilter !== "all" && calId !== calendarFilter) return false;
        if (selected && !selected.has(calId)) return false;
        if (text) {
          const haystack = `${event.summary || ""} ${event.description || ""} ${
            event.location || ""
          }`.toLowerCase();
          if (!haystack.includes(text)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aStart = a.start instanceof Date ? a.start : new Date(a.start);
        const bStart = b.start instanceof Date ? b.start : new Date(b.start);
        return aStart.getTime() - bStart.getTime();
      })
      .slice(0, 20);
  }, [events, calendarFilter, search, selectedCalendarIds]);

  if (visible.length === 0) {
    return <p className="text-gray-600 text-sm">No upcoming events match the current filters.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
      {visible.map((event) => {
        const start = event.start instanceof Date ? event.start : new Date(event.start);
        const end = event.end instanceof Date ? event.end : event.end ? new Date(event.end) : null;
        const timeLabel = event.allDay
          ? start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + " • All day"
          : `${start.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })} • ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${
              end
                ? ` – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : ""
            }`;

        return (
          <li key={event.id} className="py-3 flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {event.summary || "(no title)"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{timeLabel}</div>
              {event.location && (
                <div className="text-xs text-gray-500 dark:text-gray-400">📍 {event.location}</div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{event.calendarId || "main"}</div>
          </li>
        );
      })}
    </ul>
  );
}
