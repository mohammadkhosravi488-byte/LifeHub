"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ACCENTS, getAccent, toDate, isSameDay } from "@/lib/date-utils";

export default function CalendarDay({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
  onCalendarsDiscovered = () => {},
}) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Load events for this day
  useEffect(() => {
    if (!user) return;
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(referenceDate);
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", start),
      where("start", "<=", end),
      orderBy("start", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          ...data,
          start: toDate(data.start),
          end: toDate(data.end),
        });
      });
      setEvents(list);
    });
    return () => unsub();
  }, [user, referenceDate]);

  // Filter & discover
  const { visibleEvents, discoveredCalendars } = useMemo(() => {
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;
    const queryText = search.trim().toLowerCase();

    const filtered = events.filter((ev) => {
      const calId = ev.calendarId || "main";
      if (calendarFilter !== "all" && calId !== calendarFilter) return false;
      if (selected && !selected.has(calId)) return false;
      if (queryText) {
        const haystack = `${ev.summary || ""} ${ev.description || ""} ${
          ev.location || ""
        }`.toLowerCase();
        if (!haystack.includes(queryText)) return false;
      }
      return true;
    });

    const discovered = Array.from(
      new Set(filtered.map((e) => e.calendarId || "main"))
    )
      .filter((id) => id && id !== "main")
      .map((id) => ({ id, name: id }));

    return { visibleEvents: filtered, discoveredCalendars: discovered };
  }, [events, calendarFilter, selectedCalendarIds, search]);

  useEffect(() => {
    onCalendarsDiscovered(discoveredCalendars);
  }, [discoveredCalendars, onCalendarsDiscovered]);

  const addEvent = async () => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "events"), {
      summary: "New Event",
      start: referenceDate,
      end: new Date(referenceDate.getTime() + 60 * 60 * 1000), // +1h
      calendarId: "main",
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="bg-white dark:bg-neutral-950/60 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {referenceDate.toDateString()}
        </h2>
        <button
          onClick={addEvent}
          className="px-3 py-1 text-sm rounded-lg bg-indigo-600 text-white"
        >
          ➕ Add Event
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {visibleEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">No events today</p>
        ) : (
          visibleEvents.map((ev) => {
            const accent = getAccent(ev.calendarId);
            const start = ev.start || new Date();
            const end = ev.end;
            const timeLabel = ev.allDay
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

            return (
              <li
                key={ev.id}
                className={`rounded-xl border px-3 py-2 ${accent.base}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{ev.summary || "(no title)"}</div>
                    <div className={`text-xs ${accent.sub}`}>{timeLabel}</div>
                  </div>
                  <span className="text-xs text-gray-500">{ev.calendarId}</span>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
