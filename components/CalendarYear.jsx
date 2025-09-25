"use client";

import { useEffect, useMemo, useState } from "react";

import { useLifehubData } from "@/lib/data-context";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ensureDate(value) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export default function CalendarYear({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
  onCalendarsDiscovered = () => {},
}) {
  const { events, todos } = useLifehubData();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const searchQuery = search.trim().toLowerCase();
  const selected = useMemo(
    () => (selectedCalendarIds.length ? new Set(selectedCalendarIds) : null),
    [selectedCalendarIds]
  );

  const filteredEvents = useMemo(() => {
    return events
      .map((event) => ({
        ...event,
        start: ensureDate(event.start),
        end: ensureDate(event.end),
      }))
      .filter((event) => {
        if (!event.start || event.start.getFullYear() !== year) return false;
        const calendarId = event.calendarId || "main";
        if (calendarFilter !== "all" && calendarId !== calendarFilter) return false;
        if (selected && selected.size > 0 && !selected.has(calendarId)) return false;
        if (searchQuery) {
          const haystack = `${event.summary || ""} ${event.description || ""} ${
            event.location || ""
          }`.toLowerCase();
          if (!haystack.includes(searchQuery)) return false;
        }
        return true;
      })
      .sort((a, b) => a.start - b.start);
  }, [events, calendarFilter, selected, searchQuery, year]);

  const filteredTodos = useMemo(() => {
    return todos
      .map((todo) => ({
        ...todo,
        due: ensureDate(todo.due),
      }))
      .filter((todo) => {
        if (!todo.due || todo.due.getFullYear() !== year) return false;
        const calendarId = todo.calendarId || "main";
        if (calendarFilter !== "all" && calendarId !== calendarFilter) return false;
        if (selected && selected.size > 0 && !selected.has(calendarId)) return false;
        if (searchQuery && !todo.text?.toLowerCase().includes(searchQuery)) return false;
        return true;
      })
      .sort((a, b) => a.due - b.due);
  }, [todos, calendarFilter, selected, searchQuery, year]);

  useEffect(() => {
    const calendars = new Set();
    filteredEvents.forEach((event) => calendars.add(event.calendarId || "main"));
    filteredTodos.forEach((todo) => calendars.add(todo.calendarId || "main"));
    const discovered = Array.from(calendars)
      .filter((id) => id && id !== "main")
      .map((id) => ({ id, name: id }));
    onCalendarsDiscovered(discovered);
  }, [filteredEvents, filteredTodos, onCalendarsDiscovered]);

  const grouped = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => ({ events: [], todos: [] }));
    filteredEvents.forEach((event) => {
      if (!event.start) return;
      buckets[event.start.getMonth()].events.push(event);
    });
    filteredTodos.forEach((todo) => {
      if (!todo.due) return;
      buckets[todo.due.getMonth()].todos.push(todo);
    });
    return buckets;
  }, [filteredEvents, filteredTodos]);

  const goYear = (delta) => {
    setCurrentDate((current) => new Date(current.getFullYear() + delta, 0, 1));
  };

  const summaryCount = grouped.reduce(
    (acc, bucket) => acc + bucket.events.length + bucket.todos.length,
    0
  );

  if (summaryCount === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goYear(-1)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
          >
            Previous year
          </button>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {year}
          </div>
          <button
            type="button"
            onClick={() => goYear(1)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
          >
            Next year
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No events or tasks match the selected filters for this year.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goYear(-1)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
        >
          Previous year
        </button>
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {year}
        </div>
        <button
          type="button"
          onClick={() => goYear(1)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200"
        >
          Next year
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((bucket, index) => (
          <div
            key={MONTH_NAMES[index]}
            className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
              {MONTH_NAMES[index]}
            </div>
            <div className="mb-2 text-xs text-gray-600 dark:text-gray-300">
              {bucket.events.length} events • {bucket.todos.length} tasks
            </div>
            <ul className="space-y-1 text-xs">
              {bucket.events.slice(0, 2).map((event) => (
                <li
                  key={`event-${event.id}`}
                  className="truncate rounded-md bg-indigo-50 px-2 py-1 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100"
                  title={event.summary || "(no title)"}
                >
                  <div className="font-medium">
                    {event.summary || "(no title)"}
                  </div>
                  <div className="text-[10px] text-indigo-500">
                    {event.start?.toLocaleDateString?.()}
                  </div>
                </li>
              ))}
              {bucket.todos.slice(0, 2).map((todo) => (
                <li
                  key={`todo-${todo.id}`}
                  className="truncate rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100"
                  title={todo.text}
                >
                  <div className="font-medium">✓ {todo.text}</div>
                  <div className="text-[10px] text-emerald-500">
                    Due {todo.due?.toLocaleDateString?.()}
                  </div>
                </li>
              ))}
              {bucket.events.length + bucket.todos.length > 4 && (
                <li className="text-[10px] text-gray-500 dark:text-gray-400">
                  +{bucket.events.length + bucket.todos.length - 4} more
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
