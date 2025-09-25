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

function startOfYear(date) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfYear(date) {
  const d = new Date(date.getFullYear(), 11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}
function addYears(date, n) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + n);
  return d;
}
/* ------------------------------------------------------- */

export default function CalendarYear({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
  onCalendarsDiscovered = () => {},
}) {
  const [user, setUser] = useState(null);
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);

  const yearStart = useMemo(() => startOfYear(referenceDate), [referenceDate]);
  const yearEnd = useMemo(() => endOfYear(referenceDate), [referenceDate]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Live year query
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", Timestamp.fromDate(yearStart)),
      where("start", "<=", Timestamp.fromDate(yearEnd)),
      orderBy("start", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
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
  }, [user, yearStart.getTime(), yearEnd.getTime()]);

  // Filter + discover
  const { visibleEvents, discoveredCalendars } = useMemo(() => {
    const selected = selectedCalendarIds.length ? new Set(selectedCalendarIds) : null;
    const text = search.trim().toLowerCase();

    const filtered = events.filter((ev) => {
      const calId = ev.calendarId || "main";
      if (calendarFilter !== "all" && calId !== calendarFilter) return false;
      if (selected && !selected.has(calId)) return false;
      if (text) {
        const hay = `${ev.summary || ""} ${ev.description || ""} ${ev.location || ""}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });

    const discovered = Array.from(new Set(filtered.map((e) => e.calendarId || "main")))
      .filter((id) => id && id !== "main")
      .map((id) => ({ id, name: id }));

    return { visibleEvents: filtered, discoveredCalendars: discovered };
  }, [events, calendarFilter, selectedCalendarIds, search]);

  useEffect(() => {
    onCalendarsDiscovered(discoveredCalendars);
  }, [discoveredCalendars, onCalendarsDiscovered]);

  // Group per month
  const perMonth = useMemo(() => {
    const map = new Map(); // key 0..11 -> events[]
    for (let m = 0; m < 12; m++) map.set(m, []);
    visibleEvents.forEach((ev) => {
      const d = toDate(ev.start) || new Date();
      map.get(d.getMonth()).push(ev);
    });
    return map;
  }, [visibleEvents]);

  const summary = useMemo(() => {
    const totals = Array.from(perMonth.values()).map((arr) => arr.length);
    const total = totals.reduce((a, b) => a + b, 0);
    const busiest = totals.indexOf(Math.max(...totals));
    const quietest = totals.indexOf(Math.min(...totals));
    return { total, busiest, quietest };
  }, [perMonth]);

  const addEvent = async () => {
    if (!user) return;
    // Create event on June 1st at 10:00 as a simple demo add
    const d = new Date(referenceDate.getFullYear(), 5, 1, 10, 0, 0, 0);
    await addDoc(collection(db, "users", user.uid, "events"), {
      summary: "New event",
      start: Timestamp.fromDate(d),
      end: Timestamp.fromDate(new Date(d.getTime() + 60 * 60 * 1000)),
      calendarId: "main",
      allDay: false,
      createdAt: serverTimestamp(),
    });
  };

  const yearLabel = referenceDate.getFullYear();

  return (
    <div className="bg-white dark:bg-neutral-950/60 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Yearly overview
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{yearLabel}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{summary.total} total events</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReferenceDate((d) => addYears(d, -1))}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Previous year"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setReferenceDate(new Date())}
            className="h-9 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            This year
          </button>
          <button
            type="button"
            onClick={() => setReferenceDate((d) => addYears(d, 1))}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Next year"
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

      {/* 12 months grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, m) => {
          const list = perMonth.get(m) || [];
          const monthName = new Date(referenceDate.getFullYear(), m, 1).toLocaleDateString(undefined, {
            month: "long",
          });

          // show up to 4 sample events
          const preview = list.slice(0, 4);

          return (
            <div
              key={m}
              className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{monthName}</div>
                <div className="text-[11px] rounded-full bg-gray-100 dark:bg-neutral-800 px-2 py-[2px] text-gray-600 dark:text-gray-300">
                  {list.length} event{list.length !== 1 ? "s" : ""}
                </div>
              </div>

              {preview.length === 0 ? (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">No events yet.</p>
              ) : (
                <ul className="mt-3 space-y-1">
                  {preview.map((ev) => {
                    const accent = getAccent(ev.calendarId);
                    const start = toDate(ev.start) || new Date();
                    const end = toDate(ev.end);
                    const timeLabel = ev.allDay
                      ? "All day"
                      : `${start.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })} • ${start.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}${
                          end
                            ? ` – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : ""
                        }`;

                    return (
                      <li key={ev.id} className={`rounded-xl border px-2 py-1 ${accent.base}`}>
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                          <span className="truncate text-[11px] font-semibold">
                            {ev.summary || "(no title)"}
                          </span>
                        </div>
                        <div className={`mt-1 truncate text-[10px] ${accent.sub}`}>{timeLabel}</div>
                      </li>
                    );
                  })}
                  {list.length > 4 && (
                    <li className="text-[11px] font-medium text-indigo-500 dark:text-indigo-300">
                      +{list.length - 4} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
