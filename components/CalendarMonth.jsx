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
    (item.title || item.summary || "").toLowerCase().includes(s) ||
    (item.location || "").toLowerCase().includes(s) ||
    (item.notes || item.description || "").toLowerCase().includes(s)
  );
}

// Very simple month view placeholder that lists items by day.
// (Your day-grid UI can replace this later; this keeps logic correct.)
export default function CalendarMonth({ calendarId = "main", searchQuery = "" }) {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const { visibleEvents, discoveredCalendars } = useMemo(() => {
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;
    const queryText = search.trim().toLowerCase();

    const filtered = events.filter((event) => {
      const start = toDate(event.start) || new Date();
      if (start < monthStart || start > monthEnd) return false;
      const calId = event.calendarId || "main";
      if (calendarFilter !== "all" && calId !== calendarFilter) return false;
      if (selected && !selected.has(calId)) return false;
      if (queryText) {
        const haystack = `${event.summary || ""} ${event.description || ""} ${
          event.location || ""
        }`.toLowerCase();
        if (!haystack.includes(queryText)) return false;
      }
      return true;
    });

    const discovered = Array.from(
      new Set(filtered.map((event) => event.calendarId || "main"))
    )
      .filter((id) => id && id !== "main")
      .map((id) => ({ id, name: id }));

    return { visibleEvents: filtered, discoveredCalendars: discovered };
  }, [
    events,
    monthStart,
    monthEnd,
    calendarFilter,
    selectedCalendarIds,
    search,
  ]);

  // Live month query
  useEffect(() => {
    if (!user) return;

    (async () => {
      const col = collection(db, "users", user.uid, "events");
      // Simple order; filter client-side to avoid composite index errors.
      const snap = await getDocs(query(col, orderBy("start")));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [user]);

  const visible = useMemo(() => {
    return items.filter((it) => {
      const cal = it.calendarId ?? "main";
      const calOk = calendarId === "all" ? true : cal === calendarId;
      return calOk && matchesSearch(it, searchQuery);
    });
  }, [items, calendarId, searchQuery]);

  if (!user) return <p className="text-gray-600">Sign in to see your calendar.</p>;
  if (visible.length === 0) return <p className="text-gray-600">No events in this range.</p>;

  return (
    <div className="space-y-2">
      {visible.map((e) => {
        const start = e.start?.toDate ? e.start.toDate() : new Date(e.start);
        const end = e.end?.toDate ? e.end.toDate() : new Date(e.end);
        return (
          <div key={e.id} className="rounded-lg border border-gray-200 p-3 bg-white">
            <div className="text-sm font-semibold text-gray-900">
              {e.title || e.summary || "Untitled"}
            </div>
            <div className="text-xs text-gray-600">
              {start.toLocaleString()} → {end.toLocaleString()}
              {e.location ? ` • ${e.location}` : ""}
              {e.calendarId ? ` • ${e.calendarId}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
