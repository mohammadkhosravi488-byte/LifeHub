"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { startOfDay, endOfDay, isToday } from "date-fns";

const HOURS = [...Array(24)].map((_, i) => i); // 0..23
const ROW_HEIGHT = 80; // px per hour → 1920px total

export default function CalendarDay({ date = new Date(), calendarFilter = "all" }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const scrollRef = useRef(null);
  const [scrolled, setScrolled] = useState(false); // prevent locking scroll

  // Track auth
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Subscribe to events for this day
  useEffect(() => {
    if (!user) return;
    const start = startOfDay(date);
    const end = endOfDay(date);
    const col = collection(db, "users", user.uid, "events");

    const constraints = [
      where("start", ">=", start),
      where("start", "<=", end),
      orderBy("start", "asc"),
    ];
    if (calendarFilter !== "all") {
      constraints.unshift(where("calendarId", "==", calendarFilter));
    }

    const q = query(col, ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (e) => console.error("Day query failed", e)
    );
    return () => unsub && unsub();
  }, [user, date, calendarFilter]);

  // Auto-scroll to “now” ONCE when on today
  useEffect(() => {
  if (!scrollRef.current) return; // ✅ guard
  if (!scrolled) {
    if (isToday(date)) {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const offset = (minutes / 60) * ROW_HEIGHT;
      scrollRef.current.scrollTop = Math.max(offset - 200, 0);
    } else {
      scrollRef.current.scrollTop = 0;
    }
    setScrolled(true); // mark as done
  }
}, [date, scrolled]);

  // Normalize Firestore Timestamps
  const normalizeDate = (val) => {
    if (!val) return null;
    if (val.toDate) return val.toDate();
    if (val instanceof Date) return val;
    return new Date(val);
  };

  return (
    <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 h-[720px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h2>
      </div>

      {/* Scrollable timeline */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
        <div className="relative flex" style={{ height: ROW_HEIGHT * 24 }}>
          {/* Times column */}
          <div className="w-16 flex-shrink-0 text-right pr-2">
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-[80px] text-xs text-gray-500 dark:text-gray-400 pr-1"
              >
                {new Date(0, 0, 0, h).toLocaleTimeString([], {
                  hour: "numeric",
                  hour12: true,
                })}
              </div>
            ))}
          </div>

          {/* Grid + events */}
          <div className="flex-1 relative">
            {/* Hour lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-dashed border-gray-200 dark:border-neutral-800"
                style={{ top: h * ROW_HEIGHT }}
              />
            ))}

            {/* Events */}
            {events.map((e) => {
              const start = normalizeDate(e.start);
              const end = normalizeDate(e.end) || start;

              if (!start) return null;

              const startMins = start.getHours() * 60 + start.getMinutes();
              const endMins = end.getHours() * 60 + end.getMinutes();
              const top = (startMins / 60) * ROW_HEIGHT;
              const height = Math.max(
                32,
                ((endMins - startMins) / 60) * ROW_HEIGHT || 40
              );

              const fill = e.color || "#4F46E5";

              return (
                <div
                  key={e.id}
                  className="absolute rounded-lg shadow-md px-2 py-1 text-sm font-medium text-white"
                  style={{
                    top,
                    left: "5rem",
                    right: "1rem",
                    height,
                    background: fill,
                  }}
                >
                  <div className="truncate">{e.summary || "Untitled event"}</div>
                  <div className="text-xs opacity-80">
                    {`${start.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })} – ${end.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}`}
                  </div>
                  {e.location && (
                    <div className="text-xs opacity-80">📍 {e.location}</div>
                  )}
                </div>
              );
            })}

            {/* Current time marker */}
            {isToday(date) && <CurrentTimeLine />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentTimeLine() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const offset = (minutes / 60) * ROW_HEIGHT;

  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-none"
      style={{ top: `${offset}px` }}
    >
      <span className="ml-[60px] w-2 h-2 rounded-full bg-red-500" />
      <div className="flex-1 border-t-2 border-red-500" />
    </div>
  );
}
