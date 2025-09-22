"use client";

import { useEffect, useState, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, addDoc, Timestamp } from "firebase/firestore";

export default function CalendarYear({ year = new Date().getFullYear() }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "events"), (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data(), start: d.data().start?.toDate() })));
    });
    return () => unsub();
  }, [user]);

  const eventsByMonth = useMemo(() => {
    const map = Array(12).fill(0);
    events.forEach((ev) => {
      if (!ev.start) return;
      if (ev.start.getFullYear() === year) {
        map[ev.start.getMonth()]++;
      }
    });
    return map;
  }, [events, year]);

  const addEvent = async (monthIndex) => {
    if (!newEvent.trim() || !user) return;
    const date = new Date(year, monthIndex, 1);
    await addDoc(collection(db, "users", user.uid, "events"), {
      title: newEvent,
      start: Timestamp.fromDate(date),
      end: Timestamp.fromDate(date),
      createdAt: Timestamp.now(),
    });
    setNewEvent("");
  };

  if (!user) return <p className="text-gray-500">Sign in to see year view.</p>;

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">{year}</h2>

      <div className="flex gap-2 mb-4">
        <input
          value={newEvent}
          onChange={(e) => setNewEvent(e.target.value)}
          placeholder="New event title"
          className="flex-1 rounded-md border px-2 py-1 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 12 }, (_, m) => (
          <div
            key={m}
            className="p-3 border rounded-md bg-gray-50 dark:bg-gray-800 flex flex-col items-center"
          >
            <div className="font-semibold mb-1">
              {new Date(year, m).toLocaleString(undefined, { month: "long" })}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {eventsByMonth[m]} events
            </div>
            <button
              onClick={() => addEvent(m)}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded"
            >
              Add Event
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
