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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfWeek(date) {
  const d = new Date(date);
  const diff = d.getDay();
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek(date) {
  const d = new Date(date);
  const diff = 6 - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
}
function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}
function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
/* ------------------------------------------------------- */

export default function CalendarMonth({
  calendarFilter = "all",
  selectedCalendarIds = [],
  search = "",
  onCalendarsDiscovered = () => {},
}) {
  const [user, setUser] = useState(null);
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);

  const monthStart = useMemo(() => startOfMonth(referenceDate), [referenceDate]);
  const monthEnd = useMemo(() => endOfMonth(referenceDate), [referenceDate]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Live month query
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", Timestamp.fromDate(monthStart)),
      where("start", "<=", Timestamp.fromDate(monthEnd)),
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
  }, [user, monthStart.getTime(), monthEnd.getTime()]);

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

  // Group by ISO day
  const eventsByDay = useMemo(() => {
    const map = new Map();
    visibleEvents.forEach((ev) => {
      const start = toDate(ev.start) || new Date();
      const iso = start.toISOString().slice(0, 10);
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push({ ...ev, start, end: toDate(ev.end) });
    });
    map.forEach((arr) => arr.sort((a, b) => (a.start?.getTime?.() || 0) - (b.start?.getTime?.() || 0)));
    return map;
  }, [visibleEvents]);

  // Build cells (full weeks)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const dayCells = useMemo(() => {
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    const cells = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const iso = d.toISOString().slice(0, 10);
      cells.push({
        date: new Date(d),
        iso,
        inMonth: d.getMonth() === monthStart.getMonth(),
        items: eventsByDay.get(iso) || [],
        isToday: isSameDay(d, today),
      });
    }
    return cells;
  }, [monthStart, monthEnd, eventsByDay, today]);

  const summary = useMemo(() => {
    const inMonthCells = dayCells.filter((c) => c.inMonth);
    const busyDays = inMonthCells.filter((c) => c.items.length).length;
    const freeDays = Math.max(inMonthCells.length - busyDays, 0);
    return { total: visibleEvents.length, busyDays, freeDays };
  }, [dayCells, visibleEvents.length]);

  const addEvent = async () => {
    if (!user) return;
    // create event on the 15th at 10:00 as a quick add (demo)
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 15, 10, 0, 0, 0);
    await addDoc(collection(db, "users", user.uid, "events"), {
      summary: "New event",
      start: Timestamp.fromDate(d),
      end: Timestamp.fromDate(new Date(d.getTime() + 60 * 60 * 1000)),
      calendarId: "main",
      allDay: false,
      createdAt: serverTimestamp(),
    });
  };

  const monthLabel = referenceDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const monthRangeLabel = `${monthStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${monthEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <div className="bg-white dark:bg-neutral-950/60 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Monthly overview
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{monthLabel}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{monthRangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setReferenceDate((d) => addMonths(d, -1))}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Previous month"
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
            onClick={() => setReferenceDate((d) => addMonths(d, 1))}
            className="h-9 w-9 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-lg leading-none text-gray-600 dark:text-gray-200"
            aria-label="Next month"
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

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Total events</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled this month</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Busy days</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.busyDays}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">With at least one event</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Free days</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{summary.freeDays}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Open for focus time</p>
        </div>
      </div>

      {/* Weekdays header */}
      <div className="mt-6 grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {WEEKDAYS.map((label) => (
          <div key={label} className="text-center">{label}</div>
        ))}
      </div>

      {/* Month grid */}
      <div className="mt-3 grid grid-cols-7 gap-2">
        {(() => {
          const start = startOfWeek(monthStart);
          const end = endOfWeek(monthEnd);
          const cells = [];
          for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
            const iso = d.toISOString().slice(0, 10);
            const items = eventsByDay.get(iso) || [];
            const inMonth = d.getMonth() === monthStart.getMonth();
            const today = isSameDay(d, new Date());

            cells.push(
              <div
                key={iso}
                className={`relative min-h-[120px] rounded-2xl border px-3 py-3 text-xs transition-all ${
                  inMonth
                    ? "border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/60"
                    : "border-transparent bg-transparent text-gray-400 dark:text-gray-600"
                } ${today ? "ring-2 ring-indigo-300 dark:ring-indigo-500" : ""}`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-300">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      today
                        ? "bg-indigo-500 text-white shadow"
                        : inMonth
                        ? "text-gray-700 dark:text-gray-100"
                        : "text-gray-400"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {!!items.length && (
                    <span className="rounded-full bg-gray-100 px-2 py-[2px] text-[10px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-gray-300">
                      {items.length} event{items.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <ul className="mt-2 space-y-1">
                  {items.slice(0, 3).map((ev) => {
                    const accent = getAccent(ev.calendarId);
                    const start = ev.start || new Date();
                    const end = ev.end;
                    const timeLabel = ev.allDay
                      ? "All day"
                      : `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${
                          end
                            ? ` – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : ""
                        }`;
                    return (
                      <li key={ev.id} className={`rounded-xl border px-2 py-1 shadow-sm ${accent.base}`}>
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
                  {items.length > 3 && (
                    <li className="text-[11px] font-medium text-indigo-500 dark:text-indigo-300">
                      +{items.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            );
          }
          return cells;
        })()}
      </div>
    </div>
  );
}
