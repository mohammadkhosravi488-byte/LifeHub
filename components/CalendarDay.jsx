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
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Live query for the chosen day
  useEffect(() => {
    if (!user) return;
    const { start, end } = dayStartEnd(referenceDate);

    const q = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", Timestamp.fromDate(start)),
      where("start", "<=", Timestamp.fromDate(end)),
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
  }, [user, referenceDate]);

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

  const addEvent = async () => {
    if (!user) return;
    const start = new Date(referenceDate);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    await addDoc(collection(db, "users", user.uid, "events"), {
      summary: "New event",
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end),
      calendarId: "main",
      allDay: false,
      createdAt: serverTimestamp(),
    });
  };

  const dateLabel = referenceDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

      {/* List */}
      <ul className="mt-4 space-y-2">
        {visibleEvents.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No events for this day.</p>
        ) : (
          visibleEvents.map((ev) => {
            const accent = getAccent(ev.calendarId);
            const start = ev.start || new Date();
            const end = ev.end;
            const timeLabel = ev.allDay
              ? "All day"
              : `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${
                  end ? ` – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""
                }`;

            return (
              <li key={ev.id} className={`rounded-xl border px-3 py-2 ${accent.base}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                      <span className="truncate font-medium">{ev.summary || "(no title)"}</span>
                    </div>
                    <div className={`mt-1 text-xs ${accent.sub}`}>{timeLabel}</div>
                  </div>
                  <span className="text-[11px] text-gray-500">{ev.calendarId || "main"}</span>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
