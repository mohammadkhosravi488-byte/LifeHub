"use client";

import { useMemo } from "react";

import { useLifehubData } from "@/lib/data-context";

const MAX_RESULTS = 50;

function formatRange(event) {
  if (event.allDay) return "All day";
  const startLabel = event.start.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const endLabel = event.end
    ? event.end.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  return endLabel ? `${startLabel} – ${endLabel}` : startLabel;
}

export default function Upcoming({
  calendarFilter = "all",
  search = "",
  selectedCalendarIds = [],
}) {
  const { events } = useLifehubData();

  const visible = useMemo(() => {
    const now = new Date();
    const query = search.trim().toLowerCase();
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;

    return events
      .filter((event) => {
        const start = event.start instanceof Date ? event.start : new Date(event.start);
        if (start < now) return false;

        const calendarId = event.calendarId || "main";
        if (calendarFilter !== "all" && calendarId !== calendarFilter) return false;
        if (selected && selected.size > 0 && !selected.has(calendarId)) return false;

        if (query) {
          const haystack = `${event.summary || ""} ${event.description || ""} ${
            event.location || ""
          }`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => a.start - b.start)
      .slice(0, MAX_RESULTS);
  }, [events, calendarFilter, search, selectedCalendarIds]);

  if (visible.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        No upcoming items match the current filters.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
      {visible.map((event) => (
        <li
          key={event.id}
          className="flex items-start justify-between gap-4 py-3"
        >
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {event.summary || "(no title)"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatRange(event)}
            </div>
            {event.location && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                📍 {event.location}
              </div>
            )}
          </div>
          <div className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-900 dark:text-gray-300">
            {event.calendarId || "main"}
          </div>
        </li>
      ))}
    </ul>
  );
}
