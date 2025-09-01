"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function AddEvent({
  defaultCalendarId = "main",
  defaultDate = new Date(),
  onClose = () => {},
  onCreated = () => {},
}) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  const [title, setTitle] = useState("");
  const [calendarId, setCalendarId] = useState(defaultCalendarId);
  const [allDay, setAllDay] = useState(false);
  const [date, setDate] = useState(defaultDate.toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    if (!title.trim()) return;

    const d = new Date(date + "T00:00:00");
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    const startDate = new Date(d);
    startDate.setHours(allDay ? 0 : sh, allDay ? 0 : sm, 0, 0);

    const endDate = new Date(d);
    endDate.setHours(allDay ? 23 : eh, allDay ? 59 : em, allDay ? 59 : 0, allDay ? 999 : 0);

    setSaving(true);
    try {
      await addDoc(collection(db, "users", user.uid, "events"), {
        summary: title.trim(),
        calendarId: calendarId || "main",
        allDay: !!allDay,
        location: location || "",
        description: notes || "",
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(endDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: "manual",
      });
      setSaving(false);
      setTitle("");
      onCreated();
    } catch (e) {
      console.error(e);
      setSaving(false);
      alert("Failed to save event.");
    }
  }

  if (!user) return null;

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
              <option value="main">Main</option>
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
