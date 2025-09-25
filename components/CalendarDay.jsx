"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

const HOUR_ROW_PX = 60; // 1 hour = 60px

export default function CalendarDay({
  date = new Date(),
  calendarFilter = "main",
  selectedCalendarIds = [],
  onCalendarsDiscovered,
}) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const scrollRef = useRef(null);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // fetch events for the day
  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", Timestamp.fromDate(start)),
      where("start", "<=", Timestamp.fromDate(end)),
      orderBy("start", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = [];
        snap.forEach((d) => {
          const data = d.data() || {};
          arr.push({
            id: d.id,
            title: data.summary || data.title || "Untitled",
            start: data.start?.toDate ? data.start.toDate() : new Date(data.start),
            end: data.end?.toDate ? data.end.toDate() : new Date(data.end),
            color: data.fillColor || "#3b82f6",
            calendarId: data.calendarId || "main",
            priority: data.priority || "none",
          });
        });
        setEvents(arr);
      },
      (error) => {
        console.error("Day fetch failed", error);
        setEvents([]);
      }
    );

    return () => unsub();
  }, [user, date]);

  useEffect(() => {
    if (!onCalendarsDiscovered) return;
    const set = new Map();
    set.set("main", { id: "main", name: "Main" });
    events.forEach((ev) => {
      const id = ev.calendarId || "main";
      if (!set.has(id)) set.set(id, { id, name: id });
    });
    onCalendarsDiscovered(Array.from(set.values()));
  }, [events, onCalendarsDiscovered]);

  const filteredEvents = useMemo(() => {
    const allowed = selectedCalendarIds?.length
      ? new Set(selectedCalendarIds)
      : null;

    return events.filter((ev) => {
      const cal = ev.calendarId || "main";
      if (calendarFilter !== "all" && cal !== calendarFilter) return false;
      if (allowed && !allowed.has(cal)) return false;
      return true;
    });
  }, [events, calendarFilter, selectedCalendarIds]);

  // auto-scroll to "now" (or 8am if not today)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const now = new Date();
    const isSameDay =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();

    const targetHour = isSameDay ? now.getHours() : 8; // jump to 8am on non-today
    const y = targetHour * HOUR_ROW_PX - 100; // slight offset
    el.scrollTo({ top: Math.max(0, y), behavior: "instant" });
  }, [date]);

  // layout helpers
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const outlineForPriority = (p) => {
    switch (p) {
      case "high":
        return "ring-4 ring-red-500";
      case "medium":
        return "ring-4 ring-green-500";
      case "low":
        return "ring-4 ring-blue-500";
      default:
        return "ring-1 ring-gray-300";
    }
  };

  const positioned = useMemo(() => {
    return filteredEvents.map((ev) => {
      const startMins = ev.start.getHours() * 60 + ev.start.getMinutes();
      const endMins = ev.end
        ? ev.end.getHours() * 60 + ev.end.getMinutes()
        : startMins + 30;
      const top = (startMins / 60) * HOUR_ROW_PX;
      const height = Math.max(24, ((endMins - startMins) / 60) * HOUR_ROW_PX);
      return { ...ev, top, height };
    });
  }, [filteredEvents]);

  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);

  return (
    <div className="w-full">
      {/* Top bar inside card */}
      <div className="flex items-center gap-3 mb-3">
        <div
          aria-hidden
          className="h-8 w-8 rounded-lg border border-gray-300 grid place-items-center cursor-default"
        >
          ‹
        </div>
        <div className="text-xl font-bold">{dayLabel}</div>
      </div>

      <div
        ref={scrollRef}
        className="relative border border-gray-200 rounded-2xl bg-white"
        style={{ height: 640, overflowY: "auto" }}
      >
        <div className="grid" style={{ gridTemplateColumns: "80px 1fr" }}>
          {/* time ruler */}
          <div className="relative">
            {hours.map((h) => (
              <div
                key={h}
                className="pr-2 text-right text-gray-500 border-b border-gray-100"
                style={{ height: HOUR_ROW_PX, lineHeight: `${HOUR_ROW_PX}px` }}
              >
                {new Intl.DateTimeFormat(undefined, {
                  hour: "numeric",
                }).format(new Date(2000, 0, 1, h))}
              </div>
            ))}
          </div>

          {/* event canvas */}
          <div className="relative border-l border-gray-100">
            <div
              className="relative"
              style={{ height: 24 * HOUR_ROW_PX }}
            >
              {/* hour grid lines */}
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-b border-gray-100"
                  style={{ top: h * HOUR_ROW_PX, height: HOUR_ROW_PX }}
                />
              ))}

              {/* events */}
              {positioned.map((ev) => (
                <div
                  key={ev.id}
                  className={`absolute left-3 right-6 rounded-2xl px-3 py-2 text-sm font-semibold text-white shadow-sm ${outlineForPriority(
                    ev.priority
                  )}`}
                  style={{
                    top: ev.top,
                    height: ev.height,
                    background: ev.color,
                  }}
                  title={`${ev.title}`}
                  aria-label={`${ev.title}`}
                >
                  {ev.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
