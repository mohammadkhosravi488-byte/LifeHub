"use client";

import { useEffect, useMemo, useState } from "react";
import { useLifehubData } from "@/lib/data-context";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ACCENTS = [
  {
    base:
      "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-100",
    sub: "text-indigo-500 dark:text-indigo-200/80",
    dot: "bg-indigo-500",
  },
  {
    base:
      "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-100",
    sub: "text-emerald-500 dark:text-emerald-200/80",
    dot: "bg-emerald-500",
  },
  {
    base:
      "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-100",
    sub: "text-amber-600 dark:text-amber-200/80",
    dot: "bg-amber-500",
  },
  {
    base:
      "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-100",
    sub: "text-rose-500 dark:text-rose-200/80",
    dot: "bg-rose-500",
  },
  {
    base:
      "bg-sky-50 border-sky-100 text-sky-700 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-100",
    sub: "text-sky-500 dark:text-sky-200/80",
    dot: "bg-sky-500",
  },
];

function getAccent(calendarId) {
  const safeId = calendarId || "main";
  let hash = 0;
  for (let i = 0; i < safeId.length; i += 1) {
    hash = (hash + safeId.charCodeAt(i)) % ACCENTS.length;
  }
  return ACCENTS[hash];
}

function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  const diff = d.getDay();
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date) {
  const d = new Date(date);
  const diff = 6 - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function CalendarMonth({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
  onCalendarsDiscovered = () => {},
}) {
  const { events } = useLifehubData();
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  const monthStart = useMemo(
    () => startOfMonth(referenceDate),
    [referenceDate]
  );
  const monthEnd = useMemo(() => endOfMonth(referenceDate), [referenceDate]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { visibleEvents, discoveredCalendars } = useMemo(() => {
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;
    const queryText = search.trim().toLowerCase();

    const filtered = events.filter((event) => {
      const start = toDate(event.start) || new Date();
      if (start < monthStart || start > monthEnd) return false;
      const calId = event.calendarId || "main";
      if (calendarFilter !== "all" && calId !== calendarFilter) return false;
      if (selected && !selected.has(calId)) return false;
      if (queryText) {
        const haystack = `${event.summary || ""} ${event.description || ""} ${
          event.location || ""
        }`.toLowerCase();
        if (!haystack.includes(queryText)) return false;
      }
      return true;
    });

    const discovered = Array.from(
      new Set(filtered.map((event) => event.calendarId || "main"))
    )
      .filter((id) => id && id !== "main")
      .map((id) => ({ id, name: id }));

    return { visibleEvents: filtered, discoveredCalendars: discovered };
  }, [
    events,
    monthStart,
    monthEnd,
    calendarFilter,
    selectedCalendarIds,
    search,
  ]);

  useEffect(() => {
    onCalendarsDiscovered(discoveredCalendars);
  }, [discoveredCalendars, onCalendarsDiscovered]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    visibleEvents.forEach((event) => {
      const start = toDate(event.start) || new Date();
      const key = start.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({
        ...event,
        start,
        end: toDate(event.end),
      });
    });

    map.forEach((items) => {
      items.sort((a, b) => (a.start?.getTime?.() || 0) - (b.start?.getTime?.() || 0));
    });

    return map;
  }, [visibleEvents]);

  const dayCells = useMemo(() => {
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    const cells = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const iso = d.toISOString().slice(0, 10);
      cells.push({
        date: new Date(d),
        iso,
        inMonth: d.getMonth() === monthStart.getMonth(),
        items: eventsByDay.get(iso) || [],
        isToday: isSameDay(d, today),
      });
    }
    return cells;
  }, [monthStart, monthEnd, eventsByDay, today]);

  const summary = useMemo(() => {
    const inMonthCells = dayCells.filter((cell) => cell.inMonth);
    const busyDays = inMonthCells.filter((cell) => cell.items.length > 0).length;
    const freeDays = Math.max(inMonthCells.length - busyDays, 0);
    return {
      total: visibleEvents.length,
      busyDays,
      freeDays,
    };
  }, [dayCells, visibleEvents.length]);

  const rangeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }),
    []
  );
  const monthRangeLabel = useMemo(
    () => `${rangeFormatter.format(monthStart)} – ${rangeFormatter.format(monthEnd)}`,
    [monthStart, monthEnd, rangeFormatter]
  );

  return (
    <div className="bg-white dark:bg-neutral-950/60 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Monthly overview
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {formatMonthLabel(referenceDate)}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{monthRangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setReferenceDate((date) => addMonths(date, -1))}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setReferenceDate(new Date())}
            className="h-9 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setReferenceDate((date) => addMonths(date, 1))}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Total events
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {summary.total}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled this month</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Busy days
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {summary.busyDays}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">With at least one event</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Free days
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {summary.freeDays}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Open for focus time</p>
        </div>
      </div>

      {summary.total === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-900/40 px-5 py-6 text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            No events are showing for this month
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Try switching to the “All” calendar view or connect an additional calendar source.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {WEEKDAYS.map((label) => (
          <div key={label} className="text-center uppercase tracking-wide">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {dayCells.map((cell) => (
          <div
            key={cell.iso}
            className={`relative min-h-[120px] rounded-2xl border px-3 py-3 text-xs transition-all ${
              cell.inMonth
                ? "border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/60"
                : "border-transparent bg-transparent text-gray-400 dark:text-gray-600"
            } ${cell.isToday ? "ring-2 ring-indigo-300 dark:ring-indigo-500" : ""}`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-300">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  cell.isToday
                    ? "bg-indigo-500 text-white shadow"
                    : cell.inMonth
                    ? "text-gray-700 dark:text-gray-100"
                    : "text-gray-400"
                }`}
              >
                {cell.date.getDate()}
              </span>
              {cell.items.length ? (
                <span className="rounded-full bg-gray-100 px-2 py-[2px] text-[10px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-gray-300">
                  {cell.items.length} event{cell.items.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
            <ul className="mt-2 space-y-1">
              {cell.items.slice(0, 3).map((event) => {
                const start = event.start || new Date();
                const end = event.end;
                const timeLabel = event.allDay
                  ? "All day"
                  : `${start.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}${
                      end
                        ? ` – ${end.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : ""
                    }`;
                const accent = getAccent(event.calendarId);
                return (
                  <li
                    key={event.id}
                    className={`rounded-xl border px-2 py-1 shadow-sm ${accent.base}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} aria-hidden />
                      <span className="truncate text-[11px] font-semibold">
                        {event.summary || "(no title)"}
                      </span>
                    </div>
                    <div className={`mt-1 truncate text-[10px] ${accent.sub}`}>
                      {timeLabel}
                    </div>
                  </li>
                );
              })}
              {cell.items.length > 3 ? (
                <li className="text-[11px] font-medium text-indigo-500 dark:text-indigo-300">
                  +{cell.items.length - 3} more
                </li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
