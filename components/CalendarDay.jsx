"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AddEvent from "@/components/AddEvent";

const PX_PER_HOUR = 60; // 1h = 60px as spec
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export default function CalendarDay({
  calendarFilter = "main",
  selectedCalendarIds = [],
  onCalendarsDiscovered = () => {},
}) {
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Query events for the chosen day (range on 'start' only => no composite index)
  useEffect(() => {
    if (!user) return setEvents([]);
    const from = startOfDay(date);
    const to = endOfDay(date);

    const ref = collection(db, "users", user.uid, "events");
    const qref = query(
      ref,
      where("start", ">=", Timestamp.fromDate(from)),
      where("start", "<=", Timestamp.fromDate(to)),
      orderBy("start", "asc")
    );

    const unsub = onSnapshot(
      qref,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(rows);
        // surface any new calendar ids up to the page so filters show real chips
        const found = Array.from(
          new Set(rows.map((r) => r.calendarId || "main"))
        )
          .filter((id) => id !== "main")
          .map((id) => ({ id, name: id }));
        onCalendarsDiscovered(found);
      },
      (err) => {
        console.error("Day query failed", err);
      }
    );
    return () => unsub();
  }, [user, date, onCalendarsDiscovered]);

  const visible = useMemo(() => {
    const selected = new Set(selectedCalendarIds || []);
    return events.filter((ev) => {
      const calId = ev.calendarId || "main";
      if (calendarFilter !== "all" && calId !== calendarFilter) return false;
      if (selected.size > 0 && !selected.has(calId)) return false;
      return true;
    });
  }, [events, calendarFilter, selectedCalendarIds]);

  // positioning helpers
  const pos = useCallback((ev) => {
    const s = ev.start?.toDate?.() || new Date(ev.start);
    const e = ev.end?.toDate?.() || (ev.end ? new Date(ev.end) : null);
    const minutesFromMidnight = s.getHours() * 60 + s.getMinutes();
    const top = (minutesFromMidnight / 60) * PX_PER_HOUR;
    const endMinutes = e
      ? e.getHours() * 60 + e.getMinutes()
      : minutesFromMidnight + 30;
    const height = Math.max(30, ((endMinutes - minutesFromMidnight) / 60) * PX_PER_HOUR);
    return { top, height };
  }, []);

  const prettyDate = useMemo(() => {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [date]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            className="h-8 w-8 rounded-md border border-gray-300 bg-white"
            onClick={() => setDate((d) => new Date(d.getTime() - 86400000))}
            aria-label="Previous day"
          >
            ‹
          </button>
          <div className="text-lg font-semibold text-gray-800">{prettyDate}</div>
          <button
            className="h-8 w-8 rounded-md border border-gray-300 bg-white"
            onClick={() => setDate((d) => new Date(d.getTime() + 86400000))}
            aria-label="Next day"
          >
            ›
          </button>
          <button
            className="h-8 px-3 rounded-md border border-gray-300 bg-white ml-2"
            onClick={() => setDate(new Date())}
          >
            Today
          </button>
        </div>
        <button
          className="h-8 px-4 rounded-full border border-gray-300 bg-white text-sm font-semibold"
          onClick={() => setAdding(true)}
        >
          + Add event
        </button>
      </div>

      {/* Add event inline */}
      {adding && (
        <div className="mb-4">
          <AddEvent
            defaultCalendarId={calendarFilter === "all" ? "main" : calendarFilter}
            defaultDate={date}
            onClose={() => setAdding(false)}
            onCreated={() => setAdding(false)}
          />
        </div>
      )}

      {/* Timeline */}
      <div className="relative border-t border-gray-200">
        <div className="grid grid-cols-[80px_1fr]">
          {/* Time ruler */}
          <div className="pr-2">
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-[60px] text-right pr-1 text-xs text-gray-500 border-b border-gray-100"
              >
                {new Date(0, 0, 0, h).toLocaleTimeString([], {
                  hour: "numeric",
                })}
              </div>
            ))}
          </div>

          {/* Event canvas */}
          <div className="relative">
            {/* hour lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-b border-gray-100"
                style={{ top: h * PX_PER_HOUR, height: 0 }}
              />
            ))}

            {/* events */}
            <div className="relative" style={{ height: 24 * PX_PER_HOUR }}>
              {visible.map((ev) => {
                const { top, height } = pos(ev);
                const title = ev.summary || "(no title)";
                const cal = ev.calendarId || "main";
                return (
                  <div
                    key={ev.id}
                    className="absolute left-2 right-3 rounded-2xl"
                    style={{
                      top,
                      height,
                      background: "var(--card-bg, #eef2ff)",
                      border: "4px solid var(--outline, #c7d2fe)",
                      padding: "8px 10px",
                      overflow: "hidden",
                    }}
                    title={title}
                    aria-label={`${title}`}
                  >
                    <div className="text-xs text-gray-500 mb-1">{cal}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {title}
                    </div>
                    {ev.location && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        📍 {ev.location}
                      </div>
                    )}
                  </div>
                );
              })}
              {user && visible.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  No events today.
                </div>
              )}
              {!user && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  Sign in to view your day.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
