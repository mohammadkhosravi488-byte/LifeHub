"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, orderBy, onSnapshot
} from "firebase/firestore";
import {
  getMonthMatrix, startOfMonth, startOfNextMonth, sameDay
} from "@/lib/date";
import { subscribeCalendars } from "@/lib/calendars";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarMonth({ calendarFilter = "all" }) {
  const [user, setUser] = useState(null);
  const [month, setMonth] = useState(new Date()); // current visible month
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState([]);

  // map calendarId -> color/name
  const calMap = useMemo(() => {
    const m = {};
    for (const c of calendars) m[c.id] = { color: c.color, name: c.name };
    return m;
  }, [calendars]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // live calendars
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeCalendars(user.uid, setCalendars);
    return () => unsub && unsub();
  }, [user]);

  // fetch this month's events (live)
  useEffect(() => {
    if (!user) return;
    const col = collection(db, "users", user.uid, "events");
    const start = startOfMonth(month);
    const end = startOfNextMonth(month);

    const constraints = [
      where("start", ">=", start),
      where("start", "<", end),
      orderBy("start", "asc"),
    ];
    if (calendarFilter !== "all") {
      // Additional equality where needs a composite index (console will show link once)
      constraints.unshift(where("calendarId", "==", calendarFilter));
    }

    const q = query(col, ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        setEvents(list);
      },
      (err) => console.error("Month calendar query failed", err)
    );
    return () => unsub && unsub();
  }, [user, month, calendarFilter]);

  const grid = getMonthMatrix(month);
  const today = new Date();

  function prevMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    setMonth(d);
  }
  function nextMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    setMonth(d);
  }
  function label(d) {
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  }

  // bucket events by day
  const eventsByDay = useMemo(() => {
    const m = {};
    for (const e of events) {
      const dt = e.start?.toDate ? e.start.toDate() : new Date(e.start);
      const key = dt.toDateString();
      (m[key] ||= []).push(e);
    }
    return m;
  }, [events]);

  return (
    <div className="w-full">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="px-2 py-1 rounded border bg-white hover:bg-gray-50"
          >
            ◀
          </button>
          <button
            onClick={nextMonth}
            className="px-2 py-1 rounded border bg-white hover:bg-gray-50"
          >
            ▶
          </button>
        </div>
        <div className="text-lg font-semibold text-gray-800">
          {label(month)}
        </div>
        <div />
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-600 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>

      {/* 6x7 grid */}
      <div className="grid grid-cols-7 gap-[1px] bg-gray-200 rounded-lg overflow-hidden">
        {grid.map((d, i) => {
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = sameDay(d, today);
          const key = d.toDateString();
          const dayEvents = eventsByDay[key] || [];

          return (
            <div
              key={i}
              className={`min-h-[110px] bg-white p-2 flex flex-col ${
                inMonth ? "" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`text-xs ${
                    inMonth ? "text-gray-800" : "text-gray-400"
                  } ${isToday ? "font-bold" : ""}`}
                >
                  {d.getDate()}
                </div>
                {isToday && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
                    Today
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map((e) => {
                  const color = calMap[e.calendarId]?.color || "#4338ca";
                  const start = e.start?.toDate ? e.start.toDate() : new Date(e.start);
                  const timeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div
                      key={e.id}
                      className="text-[11px] leading-tight rounded px-2 py-1 border"
                      style={{ borderColor: color, background: "#fff" }}
                      title={e.summary}
                    >
                      <span className="font-medium" style={{ color }}>{timeStr}</span>{" "}
                      <span className="text-gray-800">{e.summary}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-gray-600">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* hint about indexes */}
      <p className="mt-3 text-xs text-gray-600">
        Tip: If a Firestore index is required for filters, the console will show a link — click it once and retry.
      </p>
    </div>
  );
}
