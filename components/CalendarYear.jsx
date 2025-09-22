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
  Timestamp,
} from "firebase/firestore";

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate();
  return new Date(val);
}
function startOfYear(d) {
  const x = new Date(d.getFullYear(), 0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfYear(d) {
  const x = new Date(d.getFullYear(), 11, 31);
  x.setHours(23, 59, 59, 999);
  return x;
}
function monthLabel(i) {
  return new Date(2000, i, 1).toLocaleString(undefined, { month: "long" });
}

export default function CalendarYear({
  currentDate = new Date(),
  calendarFilter = "main",
  selectedCalendarIds = [],
}) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  const yStart = startOfYear(currentDate);
  const yEnd = endOfYear(currentDate);

  // events in year
  useEffect(() => {
    if (!user) return;
    const qEv = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", Timestamp.fromDate(yStart)),
      where("start", "<=", Timestamp.fromDate(yEnd)),
      orderBy("start", "asc")
    );
    const unsub = onSnapshot(qEv, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        list.push({
          id: d.id,
          title: data.summary || data.title || "(no title)",
          start: toDate(data.start),
          calendarId: data.calendarId || "main",
        });
      });
      setEvents(list);
    });
    return () => unsub();
  }, [user, yStart.getTime(), yEnd.getTime()]);

  // todos (we’ll just count/peek by month if due is set)
  useEffect(() => {
    if (!user) return;
    const qTd = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qTd, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        list.push({
          id: d.id,
          title: data.text || data.title || "(untitled task)",
          due: toDate(data.due),
          calendarId: data.calendarId || "main",
          completed: !!data.completed,
        });
      });
      setTodos(list);
    });
    return () => unsub();
  }, [user]);

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

  const activeCalendars = useMemo(() => {
    if (calendarFilter === "all") return null;
    if (calendarFilter !== "main" && selectedCalendarIds?.length) {
      return new Set(selectedCalendarIds);
    }
    return new Set([calendarFilter]);
  }, [calendarFilter, selectedCalendarIds]);

  const grouped = useMemo(() => {
    const g = Array.from({ length: 12 }, () => ({ events: [], todos: [] }));

    const inCal = (cid) => !activeCalendars || activeCalendars.has(cid || "main");

    events.forEach((ev) => {
      if (!ev.start) return;
      if (!inCal(ev.calendarId)) return;
      const m = ev.start.getMonth();
      g[m].events.push(ev);
    });

    todos.forEach((td) => {
      if (!td.due) return;
      if (!inCal(td.calendarId)) return;
      const m = td.due.getMonth();
      g[m].todos.push(td);
    });

    return g;
  }, [events, todos, activeCalendars]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
        {currentDate.getFullYear()}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {grouped.map((bucket, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800"
          >
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {monthLabel(i)}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
              {bucket.events.length} events • {bucket.todos.length} tasks
            </div>

            {/* Peek list (up to 5 items) */}
            <ul className="space-y-1">
              {[...bucket.events.slice(0, 3), ...bucket.todos.slice(0, 2)].map((it) => (
                <li
                  key={`${"completed" in it ? "td" : "ev"}-${it.id}`}
                  className="truncate text-xs px-2 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                  title={it.title}
                >
                  {"completed" in it ? "✓ " : ""}
                  {it.title}
                </li>
              ))}
            </ul>

            {bucket.events.length + bucket.todos.length > 5 && (
              <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                +{bucket.events.length + bucket.todos.length - 5} more
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
