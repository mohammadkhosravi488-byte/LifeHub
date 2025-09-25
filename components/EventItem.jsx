"use client";

export default function EventItem({ event }) {
  const start = event.start instanceof Date ? event.start : new Date(event.start);
  const end = event.end instanceof Date ? event.end : event.end ? new Date(event.end) : null;
  return (
    <li className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 px-4 py-3">
      <div className="font-medium text-gray-900 dark:text-gray-100">{event.summary}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {start.toLocaleString()} {end ? `→ ${end.toLocaleString()}` : ""}
      </div>
      {event.location && (
        <div className="text-xs text-gray-500 dark:text-gray-400">📍 {event.location}</div>
      )}
    </li>
  );
}
