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
  addDoc,
} from "firebase/firestore";

// ------------------ Helpers ------------------
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
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate();
  return new Date(val);
}
function byCalendarColor(calendarId, fallback = "#818cf8") {
  if (calendarId === "main") return "#4f46e5";
  return fallback;
}

// ------------------ Component ------------------
export default function CalendarMonth({
  currentDate = new Date(),
  calendarFilter = "main",
  selectedCalendarIds = [],
}) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);

  // new event input
  const [newEvent, setNewEvent] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // --- Fetch events ---
  useEffect(() => {
    if (!user) return;
    const qEv = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", Timestamp.fromDate(monthStart)),
      where("start", "<=", Timestamp.fromDate(monthEnd)),
      orderBy("start", "asc")
    );
    const unsub = onSnapshot(qEv, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || "(no title)",
          start: toDate(data.start),
          end: toDate(data.end),
          calendarId: data.calendarId || "main",
          priority: data.priority || "none",
        };
      });
      setEvents(list);
    });
    return () => unsub();
  }, [user, monthStart.getTime(), monthEnd.getTime()]);

  // --- Fetch todos ---
  useEffect(() => {
    if (!user) return;
    const qTd = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qTd, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.text || "(untitled task)",
          due: toDate(data.due),
          completed: !!data.completed,
          calendarId: data.calendarId || "main",
          priority: data.priority || "none",
        };
      });
      setTodos(list);
    });
    return () => unsub();
  }, [user]);

  // --- Add event ---
  const handleAddEvent = async () => {
    if (!newEvent.trim() || !user) return;
    await addDoc(collection(db, "users", user.uid, "events"), {
      title: newEvent,
      start: Timestamp.fromDate(new Date()), // today
      end: Timestamp.fromDate(new Date()),
      calendarId: "main",
      priority: "none",
      createdAt: Timestamp.now(),
    });
    setNewEvent("");
  };

  // --- Active calendars ---
  const activeCalendars = useMemo(() => {
    if (calendarFilter === "all") return null;
    if (calendarFilter !== "main" && selectedCalendarIds?.length) {
      return new Set(selectedCalendarIds);
    }
    return new Set([calendarFilter]);
  }, [calendarFilter, selectedCalendarIds]);

  const monthCells = useMemo(() => {
    const firstDay = startOfWeek(startOfMonth(currentDate));
    return Array.from({ length: 42 }, (_, i) => addDays(firstDay, i));
  }, [currentDate]);

  const itemsByDay = useMemo(() => {
    const map = new Map();
    const inCal = (cid) => !activeCalendars || activeCalendars.has(cid || "main");

    events.forEach((ev) => {
      if (!ev.start || !inCal(ev.calendarId)) return;
      const key = ev.start.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { events: [], todos: [] });
      map.get(key).events.push(ev);
    });

    todos.forEach((td) => {
      if (!inCal(td.calendarId) || !td.due) return;
      const key = td.due.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { events: [], todos: [] });
      map.get(key).todos.push(td);
    });

    return map;
  }, [events, todos, activeCalendars]);

  // ------------------ Render ------------------
  if (!user)
    return <p className="text-gray-500">Sign in to see your calendar.</p>;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {currentDate.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </div>

        <div className="flex gap-2">
          <input
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            placeholder="New event title"
            className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
          />
          <button
            onClick={handleAddEvent}
            className="px-3 rounded-md bg-indigo-600 text-white text-sm"
          >
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((w) => (
          <div
            key={w}
            className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold px-2 py-2"
          >
            {w}
          </div>
        ))}

        {monthCells.map((day) => {
          const inMonth = day.getMonth() === currentDate.getMonth();
          const key = day.toISOString().slice(0, 10);
          const bucket = itemsByDay.get(key) || { events: [], todos: [] };

          return (
            <div
              key={key}
              className={`min-h-28 bg-white dark:bg-gray-900 px-2 py-2 ${
                !inMonth ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {day.getDate()}
                </div>
                {(bucket.events.length > 0 || bucket.todos.length > 0) && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {bucket.events.length} ev • {bucket.todos.length} td
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-1">
                {[...bucket.events, ...bucket.todos].slice(0, 4).map((it) => {
                  const isTodo = "completed" in it;
                  const bg = byCalendarColor(it.calendarId, "#93c5fd");
                  const borderColor =
                    it.priority === "high"
                      ? "border-red-500"
                      : it.priority === "medium"
                      ? "border-green-500"
                      : it.priority === "low"
                      ? "border-blue-500"
                      : "border-gray-300 dark:border-gray-600";

                  return (
                    <div
                      key={`${isTodo ? "td" : "ev"}-${it.id}`}
                      className="text-xs font-medium rounded-md px-2 py-1 border text-gray-900 dark:text-white"
                      style={{ backgroundColor: bg }}
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
