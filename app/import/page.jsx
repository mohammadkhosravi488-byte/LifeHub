"use client";

import { useState } from "react";
import { parseIcs } from "@/lib/ics";
import { useLifehubData } from "@/lib/data-context";

export default function ImportPage() {
  const { calendars, addEvent } = useLifehubData();
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [calendarId, setCalendarId] = useState("main");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = parseIcs(text).filter((ev) => ev.start && ev.end);
      setEvents(parsed);
      setSavedCount(0);
    } catch (err) {
      console.error(err);
      alert("Failed to parse .ics file");
    }
  };

  const saveAll = async () => {
    if (events.length === 0) return;
    setSaving(true);
    let success = 0;
    for (const ev of events) {
      try {
        addEvent({
          summary: ev.summary,
          description: ev.description,
          location: ev.location,
          start: ev.start,
          end: ev.end,
          allDay: ev.allDay,
          calendarId,
        });
        success += 1;
        setSavedCount(success);
      } catch (error) {
        console.error("Save failed for", ev.summary, error);
      }
    }
    setSaving(false);
    alert(`Saved ${success} events.`);
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Import Calendar (.ics)</h1>
      <input
        type="file"
        accept=".ics,text/calendar"
        onChange={handleFile}
        className="mb-4"
      />
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Save to calendar:
        </label>
        <select
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          className="h-9 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm"
        >
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>
              {cal.name}
            </option>
          ))}
        </select>
      </div>
      {events.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-800">
            Parsed <strong>{events.length}</strong> events.
            {savedCount > 0 && (
              <>
                {" "}
                Saved: <strong>{savedCount}</strong>
              </>
            )}
          </p>
          <button
            onClick={saveAll}
            disabled={saving}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save to my calendar"}
          </button>
        </div>
      )}
    </main>
  );
}
