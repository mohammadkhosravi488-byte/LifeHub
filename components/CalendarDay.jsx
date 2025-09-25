"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import AddEvent from "@/components/AddEvent";
import { useLifehubData } from "@/lib/data-context";
import { addDays, endOfDay, startOfDay } from "@/lib/date";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const PX_PER_HOUR = 56;

const ACCENTS = [
  {
    base: "bg-indigo-100/80 border-indigo-200 text-indigo-900",
    sub: "text-indigo-500",
  },
  {
    base: "bg-emerald-100/80 border-emerald-200 text-emerald-900",
    sub: "text-emerald-500",
  },
  {
    base: "bg-amber-100/80 border-amber-200 text-amber-900",
    sub: "text-amber-500",
  },
  {
    base: "bg-rose-100/80 border-rose-200 text-rose-900",
    sub: "text-rose-500",
  },
  {
    base: "bg-sky-100/80 border-sky-200 text-sky-900",
    sub: "text-sky-500",
  },
];

function ensureDate(value) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function getAccent(calendarId) {
  const safe = calendarId || "main";
  let hash = 0;
  for (let index = 0; index < safe.length; index += 1) {
    hash = (hash + safe.charCodeAt(index)) % ACCENTS.length;
  }
  return ACCENTS[hash];
}

function formatRange(event) {
  if (event.allDay) return "All day";
  const start = ensureDate(event.start);
  const end = ensureDate(event.end);
  if (!start) return "";
  const startLabel = start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!end) return startLabel;
  const endLabel = end.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${startLabel} – ${endLabel}`;
}

export default function CalendarDay({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
  onCalendarsDiscovered = () => {},
}) {
  const { events } = useLifehubData();
  const [referenceDate, setReferenceDate] = useState(() => startOfDay(new Date()));
  const [adding, setAdding] = useState(false);

  const bounds = useMemo(() => {
    const start = startOfDay(referenceDate);
    const end = endOfDay(referenceDate);
    return { start, end };
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
        end: ensureDate(event.end) || ensureDate(event.start),
      }))
      .filter((event) => {
        if (!event.start) return false;
        const calendarId = event.calendarId || "main";
        if (calendarFilter !== "all" && calendarId !== calendarFilter) return false;
        if (selected && selected.size > 0 && !selected.has(calendarId)) return false;
        if (event.end < bounds.start || event.start > bounds.end) return false;

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
    calendarFilter,
    selectedCalendarIds,
    search,
    bounds.start,
    bounds.end,
  ]);

  useEffect(() => {
    const discovered = Array.from(
      new Set(visibleEvents.map((event) => event.calendarId || "main"))
    )
      .filter((id) => id && id !== "main")
      .map((id) => ({ id, name: id }));
    onCalendarsDiscovered(discovered);
  }, [visibleEvents, onCalendarsDiscovered]);

  const position = useCallback(
    (event) => {
      const startMinutes = Math.max(
        0,
        (event.start.getTime() - bounds.start.getTime()) / 60000
      );
      const endMinutes = Math.min(
        24 * 60,
        (event.end.getTime() - bounds.start.getTime()) / 60000
      );
      const top = (startMinutes / 60) * PX_PER_HOUR;
      const height = Math.max(40, ((endMinutes - startMinutes) / 60) * PX_PER_HOUR);
      return { top, height };
    },
    [bounds.start]
  );

  const dateLabel = useMemo(
    () =>
      referenceDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [referenceDate]
  );

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Daily overview
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {dateLabel}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReferenceDate((current) => addDays(current, -1))}
            className="h-9 w-9 rounded-xl border border-gray-300 bg-white text-lg text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
            aria-label="Previous day"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setReferenceDate(startOfDay(new Date()))}
            className="h-9 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setReferenceDate((current) => addDays(current, 1))}
            className="h-9 w-9 rounded-xl border border-gray-300 bg-white text-lg text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
            aria-label="Next day"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-3 h-9 rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            ➕ Add event
          </button>
        </div>
      </div>

      {adding && (
        <div className="mb-4 mt-4">
          <AddEvent
            defaultCalendarId={calendarFilter === "all" ? "main" : calendarFilter}
            defaultDate={referenceDate}
            onClose={() => setAdding(false)}
            onCreated={() => setAdding(false)}
          />
        </div>
      )}

      <div className="relative mt-4 border-t border-gray-200 dark:border-neutral-800">
        <div className="grid grid-cols-[80px_1fr]">
          <div className="pr-2">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-[56px] border-b border-gray-100 pr-1 text-right text-xs text-gray-500 dark:border-neutral-800 dark:text-gray-500"
              >
                {new Date(0, 0, 0, hour).toLocaleTimeString([], { hour: "numeric" })}
              </div>
            ))}
          </div>
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={`line-${hour}`}
                className="absolute left-0 right-0 border-b border-dashed border-gray-100 dark:border-neutral-800"
                style={{ top: hour * PX_PER_HOUR }}
              />
            ))}
            <div className="relative" style={{ height: HOURS.length * PX_PER_HOUR }}>
              {visibleEvents.map((event) => {
                const { top, height } = position(event);
                const accent = getAccent(event.calendarId);
                return (
                  <div
                    key={event.id}
                    className={`absolute left-2 right-3 rounded-2xl border px-3 py-2 shadow-sm ${accent.base}`}
                    style={{ top, height }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {event.calendarId || "main"}
                    </div>
                    <div className="text-sm font-semibold">
                      {event.summary || "(no title)"}
                    </div>
                    <div className={`mt-1 text-xs ${accent.sub}`}>
                      {formatRange(event)}
                    </div>
                    {event.location && (
                      <div className="mt-1 text-xs text-gray-600">
                        📍 {event.location}
                      </div>
                    )}
                  </div>
                );
              })}

              {visibleEvents.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  No events scheduled for this day.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
