"use client";

import { useEffect, useMemo, useState } from "react";
import { useLifehubData } from "@/lib/data-context";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

function startOfYear(date) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfYear(date) {
  const d = new Date(date.getFullYear(), 11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function CalendarYear({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
  onCalendarsDiscovered = () => {},
}) {
  const { events, todos } = useLifehubData();
  const [year, setYear] = useState(() => new Date().getFullYear());

  const yearStart = useMemo(() => startOfYear(new Date(year, 0, 1)), [year]);
  const yearEnd = useMemo(() => endOfYear(new Date(year, 0, 1)), [year]);

  const { monthBuckets, discovered } = useMemo(() => {
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;
    const queryText = search.trim().toLowerCase();

    const buckets = Array.from({ length: 12 }, (_, month) => ({
      month,
      events: [],
    }));

    events.forEach((event) => {
      const start = toDate(event.start) || new Date();
      if (start < yearStart || start > yearEnd) return;
      const calId = event.calendarId || "main";
      if (calendarFilter !== "all" && calId !== calendarFilter) return;
      if (selected && !selected.has(calId)) return;
      if (queryText) {
        const haystack = `${event.summary || ""} ${event.description || ""} ${
          event.location || ""
        }`.toLowerCase();
        if (!haystack.includes(queryText)) return;
      }
      buckets[start.getMonth()].events.push({ ...event, start });
    });

    const discovered = Array.from(new Set(buckets.flatMap((bucket) => bucket.events.map((e) => e.calendarId || "main"))))
      .filter((id) => id && id !== "main")
      .map((id) => ({ id, name: id }));

    return { monthBuckets: buckets, discovered };
  }, [
    events,
    yearStart,
    yearEnd,
    calendarFilter,
    selectedCalendarIds,
    search,
  ]);

  useEffect(() => {
    onCalendarsDiscovered(discovered);
  }, [discovered, onCalendarsDiscovered]);

  const todoSummary = useMemo(() => {
    const selected = selectedCalendarIds.length ? new Set(selectedCalendarIds) : null;
    const counts = Array.from({ length: 12 }, () => 0);
    todos.forEach((todo) => {
      const due = todo.due ? toDate(todo.due) : null;
      const calId = todo.calendarId || "main";
      if (calendarFilter !== "all" && calId !== calendarFilter) return;
      if (selected && !selected.has(calId)) return;
      if (!due || due.getFullYear() !== year) return;
      counts[due.getMonth()] += 1;
    });
    return counts;
  }, [todos, year, calendarFilter, selectedCalendarIds]);

  const totals = useMemo(() => {
    const totalEvents = monthBuckets.reduce((acc, bucket) => acc + bucket.events.length, 0);
    const busiest = monthBuckets.reduce(
      (acc, bucket) => (bucket.events.length > acc.count ? { month: bucket.month, count: bucket.events.length } : acc),
      { month: new Date().getMonth(), count: 0 }
    );
    return { totalEvents, busiestMonth: busiest.month, busiestCount: busiest.count };
  }, [monthBuckets]);

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Year at a glance
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{year}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totals.totalEvents} events captured • busiest month {MONTH_LABELS[totals.busiestMonth]} ({totals.busiestCount})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setYear((value) => value - 1)}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Previous year"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setYear(new Date().getFullYear())}
            className="h-9 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            This year
          </button>
          <button
            type="button"
            onClick={() => setYear((value) => value + 1)}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Next year"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {monthBuckets.map((bucket) => {
          const label = MONTH_LABELS[bucket.month];
          const count = bucket.events.length;
          const todosDue = todoSummary[bucket.month] || 0;
          const topEvents = bucket.events
            .slice()
            .sort((a, b) => (a.start?.getTime?.() || 0) - (b.start?.getTime?.() || 0))
            .slice(0, 3);
          return (
            <div
              key={bucket.month}
              className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-4"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {count} event{count === 1 ? "" : "s"}
                  </p>
                </div>
                {todosDue > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-[2px] text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                    {todosDue} task{todosDue === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {topEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No events saved yet.</p>
                ) : (
                  topEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/70 dark:bg-neutral-800/60 px-3 py-2"
                    >
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {event.summary || "Untitled event"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {event.start.toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                        })}
                        {event.allDay
                          ? " • All day"
                          : ` • ${event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
