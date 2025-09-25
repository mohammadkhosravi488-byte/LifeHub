"use client";

import { useMemo, useState } from "react";
import { useLifehubData } from "@/lib/data-context";

export default function TodoList({
  calendarFilter = "all",
  search = "",
  selectedCalendarIds = [],
}) {
  const { calendars, todos, addTodo, toggleTodo, removeTodo } = useLifehubData();
  const [text, setText] = useState("");
  const [calendarId, setCalendarId] = useState("main");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  const calendarOptions = useMemo(() => {
    if (!calendars.some((cal) => cal.id === "main")) {
      return [{ id: "main", name: "Personal" }, ...calendars];
    }
    return calendars;
  }, [calendars]);

  const visible = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;

    return todos.filter((todo) => {
      const cal = todo.calendarId || "main";
      if (calendarFilter !== "all" && cal !== calendarFilter) return false;
      if (selected && !selected.has(cal)) return false;
      if (queryText && !todo.text.toLowerCase().includes(queryText)) return false;
      return true;
    });
  }, [todos, calendarFilter, selectedCalendarIds, search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;

    setSaving(true);
    addTodo({
      text: value,
      calendarId: calendarId || "main",
      due: due ? new Date(`${due}T23:59:59`) : null,
    });
    setText("");
    setDue("");
    setSaving(false);
  };

  return (
    <div className="w-full space-y-4">
      <form
        onSubmit={handleSubmit}
        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a to-do…"
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
        />
        <select
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-2 text-sm"
        >
          {calendarOptions.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </form>

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing to show right now.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((todo) => (
            <li
              key={todo.id}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  className={`text-left flex-1 text-sm ${
                    todo.done
                      ? "line-through text-gray-400"
                      : "text-gray-800"
                  }`}
                >
                  {todo.text || "Untitled task"}
                </button>
                <button
                  type="button"
                  onClick={() => removeTodo(todo.id)}
                  className="text-red-500 text-xs font-medium hover:underline"
                >
                  Delete
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-[11px] uppercase tracking-wide text-gray-500">
                <span>{todo.calendarId || "main"}</span>
                {todo.due ? (
                  <span>
                    Due {todo.due.toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
