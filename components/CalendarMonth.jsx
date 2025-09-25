"use client";

import { useEffect, useMemo, useState } from "react";

import { useLifehubData } from "@/lib/data-context";
import {
  getMonthMatrix,
  sameDay,
  startOfMonth,
  startOfNextMonth,
} from "@/lib/date";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ensureDate(value) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function formatTime(event) {
  if (event.allDay) return "All day";
  const start = ensureDate(event.start);
  if (!start) return "";
  if (!event.end) {
    return start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const end = ensureDate(event.end);
  return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function CalendarMonth({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
  onCalendarsDiscovered = () => {},
}) {
  const { events } = useLifehubData();
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  const goToMonth = (delta) => {
    setReferenceDate((current) =>
      new Date(current.getFullYear(), current.getMonth() + delta, 1)
    );
  };

  const monthStart = useMemo(
    () => startOfMonth(referenceDate),
    [referenceDate]
  );
  const monthEnd = useMemo(() => {
    const next = startOfNextMonth(referenceDate);
    return new Date(next.getTime() - 1);
  }, [referenceDate]);

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;

    return events
      .map((event) => ({
        ...event,
        start: ensureDate(event.start),
        end: ensureDate(event.end),
      }))
      .filter((event) => {
        if (!event.start) return false;
        if (event.start < monthStart || event.start > monthEnd) return false;

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
      .sort((a, b) => a.start - b.start);
  }, [
    events,
    monthStart,
    monthEnd,
    calendarFilter,
    selectedCalendarIds,
    search,
  ]);

  useEffect(() => {
    const discovered = Array.from(
      new Set(visibleEvents.map((event) => event.calendarId || "main"))
    )
      .filter((id) => id && id !== "main")
      .map((id) => ({ id, name: id }));
    onCalendarsDiscovered(discovered);
  }, [visibleEvents, onCalendarsDiscovered]);

  const monthCells = useMemo(
    () => getMonthMatrix(referenceDate),
    [referenceDate]
  );

  const today = useMemo(() => new Date(), []);

  const monthLabel = useMemo(
    () =>
      referenceDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [referenceDate]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map();
    monthCells.forEach((date) => {
      map.set(date.toDateString(), []);
    });
    visibleEvents.forEach((event) => {
      const key = event.start?.toDateString?.();
      if (key && map.has(key)) {
        map.get(key).push(event);
      }
    });
    return map;
  }, [monthCells, visibleEvents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
        >
          Previous
        </button>
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
        >
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="text-center">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {monthCells.map((date) => {
          const isCurrentMonth = date.getMonth() === referenceDate.getMonth();
          const isToday = sameDay(date, today);
          const key = date.toDateString();
          const eventsForDay = eventsByDay.get(key) || [];

          return (
            <div
              key={key}
              className={`min-h-[120px] rounded-xl border p-2 text-xs ${
                isCurrentMonth
                  ? "border-gray-200 bg-white text-gray-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100"
                  : "border-dashed border-gray-200 bg-gray-50 text-gray-400 dark:border-neutral-800 dark:bg-neutral-950"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`h-6 w-6 rounded-full text-center text-sm font-semibold ${
                    isToday
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {date.getDate()}
                </div>
                <span className="text-[10px] uppercase text-gray-400">
                  {eventsForDay.length}
                </span>
              </div>

              <ul className="mt-2 space-y-1">
                {eventsForDay.slice(0, 3).map((event) => (
                  <li
                    key={event.id}
                    className="truncate rounded-md bg-indigo-50 px-2 py-1 text-[11px] text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100"
                    title={event.summary || "(no title)"}
                  >
                    <div className="font-medium">
                      {event.summary || "(no title)"}
                    </div>
                    <div className="text-[10px] text-indigo-500">
                      {formatTime(event)}
                    </div>
                  </li>
                ))}
                {eventsForDay.length > 3 && (
                  <li className="text-[10px] text-gray-500 dark:text-gray-400">
                    +{eventsForDay.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {visibleEvents.length === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No events match the current filters for this month.
        </p>
      )}
    </div>
  );
}
