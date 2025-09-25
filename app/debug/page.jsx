"use client";

import { useMemo, useState } from "react";
import { useLifehubData } from "@/lib/data-context";

export default function DebugPage() {
  const { user, calendars, events, todos, resetData } = useLifehubData();
  const [exported, setExported] = useState(null);

  const summary = useMemo(() => {
    const totalDuration = events.reduce((acc, event) => {
      const start = event.start?.getTime?.() || new Date(event.start).getTime();
      const end = event.end?.getTime?.() || start;
      return acc + Math.max(0, end - start);
    }, 0);
    return {
      calendars: calendars.length,
      events: events.length,
      todos: todos.length,
      focusedHours: Math.round(totalDuration / (1000 * 60 * 60)),
    };
  }, [calendars, events, todos]);

  const exportData = () => {
    const payload = {
      user,
      calendars,
      events: events.map((event) => ({
        ...event,
        start: event.start?.toISOString?.() || event.start,
        end: event.end?.toISOString?.() || null,
      })),
      todos: todos.map((todo) => ({
        ...todo,
        due: todo.due?.toISOString?.() || null,
      })),
      exportedAt: new Date().toISOString(),
    };
    setExported(JSON.stringify(payload, null, 2));
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Debug</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Quick snapshot of the in-browser LifeHub demo state.
          </p>
        </div>
        <button
          onClick={resetData}
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold"
        >
          Reset demo data
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            Profile
          </h2>
          <p className="mt-2 text-base font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            Totals
          </h2>
          <dl className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <dt>Calendars</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{summary.calendars}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Events</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{summary.events}</dd>
            </div>
            <div className="flex justify-between">
              <dt>To-dos</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{summary.todos}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Planned focus hours</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100">{summary.focusedHours}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            Export snapshot
          </h2>
          <button
            onClick={exportData}
            className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium"
          >
            Export JSON
          </button>
        </div>
        {exported ? (
          <pre className="max-h-80 overflow-auto rounded-md bg-gray-900 text-gray-100 text-xs p-3">
{exported}
          </pre>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Press “Export JSON” to view the current in-memory dataset. The dump never leaves your browser.
          </p>
        )}
      </section>
    </main>
  );
}
