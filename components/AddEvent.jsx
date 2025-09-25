"use client";

import { useMemo, useState } from "react";
import { useLifehubData } from "@/lib/data-context";

export default function AddEvent({
  defaultCalendarId = "main",
  defaultDate = new Date(),
  onClose = () => {},
  onCreated = () => {},
}) {
  const { calendars, addEvent } = useLifehubData();
  const [title, setTitle] = useState("");
  const [calendarId, setCalendarId] = useState(defaultCalendarId);
  const [allDay, setAllDay] = useState(false);
  const [date, setDate] = useState(defaultDate.toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => {
    if (!calendars.some((cal) => cal.id === "main")) {
      return [{ id: "main", name: "Personal" }, ...calendars];
    }
    return calendars;
  }, [calendars]);

  async function save() {
    if (!title.trim()) return;

    const base = new Date(`${date}T00:00:00`);
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startDate = new Date(base);
    startDate.setHours(allDay ? 0 : startHour, allDay ? 0 : startMinute, 0, 0);

    const endDate = new Date(base);
    if (allDay) {
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate.setHours(endHour, endMinute, 0, 0);
    }

    try {
      setSaving(true);
      addEvent({
        summary: title.trim(),
        calendarId: calendarId || "main",
        allDay,
        location,
        description: notes,
        start: startDate,
        end: endDate,
      });
      setTitle("");
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 p-3 bg-white">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <input
            className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <label className="text-sm text-gray-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              All-day
            </label>
            <select
              className="h-9 rounded-lg border border-gray-300 px-2 text-sm"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            >
              {options.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <input
            type="date"
            className="w-full h-9 rounded-lg border border-gray-300 px-3 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {!allDay && (
            <div className="flex gap-2">
              <input
                type="time"
                className="h-9 rounded-lg border border-gray-300 px-2 text-sm"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              <input
                type="time"
                className="h-9 rounded-lg border border-gray-300 px-2 text-sm"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          )}
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 text-sm py-2"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
