"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";

/* ---------- Shared styling + helpers (inline) ---------- */
const ACCENTS = [
  {
    base:
      "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-100",
    sub: "text-indigo-500 dark:text-indigo-200/80",
    dot: "bg-indigo-500",
  },
  {
    base:
      "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-100",
    sub: "text-emerald-500 dark:text-emerald-200/80",
    dot: "bg-emerald-500",
  },
  {
    base:
      "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-100",
    sub: "text-amber-600 dark:text-amber-200/80",
    dot: "bg-amber-500",
  },
  {
    base:
      "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-100",
    sub: "text-rose-500 dark:text-rose-200/80",
    dot: "bg-rose-500",
  },
  {
    base:
      "bg-sky-50 border-sky-100 text-sky-700 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-100",
    sub: "text-sky-500 dark:text-sky-200/80",
    dot: "bg-sky-500",
  },
];

function getAccent(calendarId) {
  const safeId = calendarId || "main";
  let hash = 0;
  for (let i = 0; i < safeId.length; i++) hash = (hash + safeId.charCodeAt(i)) % ACCENTS.length;
  return ACCENTS[hash];
}

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  return new Date(v);
}

function dayStartEnd(d) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
/* ------------------------------------------------------- */

export default function CalendarDay({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
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
    <div className="bg-white dark:bg-neutral-950/60 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
      {/* Header / controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Daily overview
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{dateLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReferenceDate((d) => addDays(d, -1))}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Previous day"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setReferenceDate(new Date())}
            className="h-9 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setReferenceDate((d) => addDays(d, 1))}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Next day"
          >
            ›
          </button>

          <button
            onClick={addEvent}
            disabled={!user}
            className="ml-3 h-9 px-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
          >
            ➕ Add event
          </button>
        </div>
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
                    <div className={`mt-1 text-xs ${accent.sub}`}>{timeLabel}</div>
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
