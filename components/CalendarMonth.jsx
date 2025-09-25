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

// Helpers
function startOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate();
  return new Date(val);
}
function byCalendarColor(calendarId, fallback = "#818cf8") {
  // Simple mapping; you can wire actual colors from your calendar objects if you like
  if (calendarId === "main") return "#4f46e5";
  return fallback; // per-calendar stored color can be injected later
}

export default function CalendarMonth({
  currentDate = new Date(),
  calendarFilter = "main",
  selectedCalendarIds = [],
  onCalendarsDiscovered,
}) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]); // {id,title,start,calendarId,priority}
  const [todos, setTodos] = useState([]);   // {id,title,due,calendarId,priority,completed}

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Read month range
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch events in month (users/{uid}/events)
  useEffect(() => {
    if (!user) return;
    const qEv = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", Timestamp.fromDate(monthStart)),
      where("start", "<=", Timestamp.fromDate(monthEnd)),
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
          end: toDate(data.end),
          calendarId: data.calendarId || "main",
          priority: data.priority || "none",
        });
      });
      setEvents(list);
    });
    return () => unsub();
  }, [user, monthStart.getTime(), monthEnd.getTime()]);

  // Fetch todos that have due date in month (users/{uid}/todos)
  useEffect(() => {
    if (!user) return;
    // if you don't store due, we'll still show undated todos under today
    const qTd = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qTd, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        const due = toDate(data.due);
        // Keep all; we’ll filter by range/client-side to avoid new indexes
        list.push({
          id: d.id,
          title: data.text || data.title || "(untitled task)",
          due,
          completed: !!data.completed,
          calendarId: data.calendarId || "main",
          priority: data.priority || "none",
        });
      });
      setTodos(list);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!onCalendarsDiscovered) return;
    const set = new Map();
    set.set("main", { id: "main", name: "Main" });
    events.forEach((ev) => {
      const id = ev.calendarId || "main";
      if (!set.has(id)) set.set(id, { id, name: id });
    });
    todos.forEach((td) => {
      const id = td.calendarId || "main";
      if (!set.has(id)) set.set(id, { id, name: id });
    });
    onCalendarsDiscovered(Array.from(set.values()));
  }, [events, todos, onCalendarsDiscovered]);

  // Filter by calendar(s)
  const activeCalendars = useMemo(() => {
    if (selectedCalendarIds?.length) {
      return new Set(selectedCalendarIds);
    }
    if (calendarFilter === "all") return null;
    return new Set([calendarFilter]);
  }, [calendarFilter, selectedCalendarIds]);

  const monthCells = useMemo(() => {
    // Build a 6x7 grid from the start of first week to end of last week
    const firstDay = startOfWeek(startOfMonth(currentDate));
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const day = addDays(firstDay, i);
      cells.push(day);
    }
    return cells;
  }, [currentDate]);

  const itemsByDay = useMemo(() => {
    const map = new Map(); // key yyyy-mm-dd => {events:[],todos:[]}

    const inCal = (cid) =>
      !activeCalendars || activeCalendars.has(cid || "main");

    // events
    events.forEach((ev) => {
      if (!ev.start) return;
      if (!inCal(ev.calendarId)) return;
      if (ev.start < monthStart || ev.start > monthEnd) return;
      const key = ev.start.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { events: [], todos: [] });
      map.get(key).events.push(ev);
    });

    // todos (if due exists and is in month; else we can drop them or stick on today)
    todos.forEach((td) => {
      if (!inCal(td.calendarId)) return;
      const day = td.due && td.due instanceof Date ? td.due : null;
      if (!day) return; // if you want undated tasks to show on today, you can add that here.
      if (day < monthStart || day > monthEnd) return;
      const key = day.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { events: [], todos: [] });
      map.get(key).todos.push(td);
    });

    return map;
  }, [events, todos, activeCalendars, monthStart.getTime(), monthEnd.getTime()]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
      <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
        {currentDate.toLocaleString(undefined, { month: "long", year: "numeric" })}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {/* Weekday headers */}
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((w) => (
          <div
            key={w}
            className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold px-2 py-2"
          >
            {w}
          </div>
        ))}

        {/* Day cells */}
        {monthCells.map((day) => {
          const inMonth = day.getMonth() === currentDate.getMonth();
          const key = day.toISOString().slice(0, 10);
          const bucket = itemsByDay.get(key) || { events: [], todos: [] };

          return (
            <div
              key={key}
              className={[
                "min-h-28 bg-white dark:bg-gray-900 px-2 py-2",
                !inMonth ? "opacity-50" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div
                  className={[
                    "text-sm font-semibold",
                    "text-gray-800 dark:text-gray-100",
                  ].join(" ")}
                >
                  {day.getDate()}
                </div>
                {/* Counts */}
                {(bucket.events.length > 0 || bucket.todos.length > 0) && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {bucket.events.length} ev • {bucket.todos.length} td
                  </div>
                )}
              </div>

              {/* Items list: show up to 4 (events first), then +N */}
              <div className="mt-2 space-y-1">
                {[...bucket.events, ...bucket.todos.slice(0)].slice(0, 4).map((it) => {
                  const isTodo = "completed" in it;
                  const bg = byCalendarColor(it.calendarId, "#93c5fd"); // light blue fallback
                  const textClass = "text-gray-900 dark:text-white"; // readable on our solid bg
                  const borderColor =
                    it.priority === "high"
                      ? "border-red-500"
                      : it.priority === "med" || it.priority === "medium"
                      ? "border-green-500"
                      : it.priority === "low"
                      ? "border-blue-500"
                      : "border-gray-300 dark:border-gray-600";

                  return (
                    <div
                      key={`${isTodo ? "td" : "ev"}-${it.id}`}
                      className={`text-xs font-medium rounded-md px-2 py-1 border ${textClass}`}
                      style={{ backgroundColor: bg }}
                      title={isTodo ? "Task" : "Event"}
                    >
                      <div className={`rounded-sm border-2 ${borderColor} px-1`}>
                        {isTodo ? "✓ " : ""}
                        {it.title}
                      </div>
                    </div>
                  );
                })}

                {bucket.events.length + bucket.todos.length > 4 && (
                  <div className="text-[11px] text-gray-600 dark:text-gray-300">
                    +{bucket.events.length + bucket.todos.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
