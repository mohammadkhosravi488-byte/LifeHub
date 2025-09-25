"use client";

import { useMemo, useState } from "react";

import { useLifehubData } from "@/lib/data-context";

const FALLBACK_CALENDAR_NAME = "Personal";

export default function TodoList({
  calendarFilter = "all",
  search = "",
  selectedCalendarIds = [],
}) {
  const { calendars, todos, addTodo, toggleTodo, removeTodo } = useLifehubData();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const calendarNameById = useMemo(() => {
    const map = new Map();
    calendars.forEach((calendar) => {
      if (calendar?.id) {
        map.set(calendar.id, calendar.name || calendar.id);
      }
    });
    if (!map.has("main")) {
      map.set("main", FALLBACK_CALENDAR_NAME);
    }
    return map;
  }, [calendars]);

  const derivedCalendarId = useMemo(() => {
    if (calendarFilter !== "all") return calendarFilter;
    if (selectedCalendarIds.length === 1) return selectedCalendarIds[0];
    return "main";
  }, [calendarFilter, selectedCalendarIds]);

  const filteredTodos = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;

    return todos
      .filter((todo) => {
        const calendarId = todo.calendarId || "main";
        if (calendarFilter !== "all" && calendarId !== calendarFilter) return false;
        if (selected && selected.size > 0 && !selected.has(calendarId)) return false;
        if (query && !todo.text?.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }, [
    todos,
    calendarFilter,
    search,
    selectedCalendarIds,
  ]);

  const add = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      addTodo({ text: trimmed, calendarId: derivedCalendarId });
      setText("");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id) => toggleTodo(id);
  const remove = (id) => removeTodo(id);

  if (filteredTodos.length === 0 && !text) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Add your first task to get started.
        </p>
        <form onSubmit={add} className="flex gap-2">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Add a to-do…"
            className="flex-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Add a to-do…"
          className="flex-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </form>

      <ul className="space-y-2">
        {filteredTodos.map((todo) => {
          const calendarId = todo.calendarId || "main";
          const calendarName = calendarNameById.get(calendarId) || calendarId;
          const dueLabel = todo.due
            ? todo.due.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            : null;

          return (
            <li
              key={todo.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 shadow-sm transition hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-neutral-800"
            >
              <button
                type="button"
                onClick={() => toggle(todo.id)}
                className={`flex-1 text-left ${
                  todo.done
                    ? "text-gray-400 line-through"
                    : "text-gray-800 dark:text-gray-50"
                }`}
              >
                <div className="font-medium">{todo.text}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="rounded-full bg-white px-2 py-0.5 dark:bg-neutral-800">
                    {calendarName}
                  </span>
                  {dueLabel && <span>Due {dueLabel}</span>}
                </div>
              </button>
              <button
                type="button"
                onClick={() => remove(todo.id)}
                className="text-xs font-semibold text-red-500 hover:underline"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
