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
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
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
      setError(null);
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
        setError(null);
      },
      (err) => {
        console.error("Day fetch failed", err);
        setEvents([]);
        setError(err);
      }
    );

    return () => unsub();
  }, [user, date, refreshToken]);

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

  const errorMessage = error
    ? error.code === "permission-denied"
      ? "We don’t have permission to load this calendar. Ask the owner to share it or adjust your Firestore rules."
      : "We couldn’t load your events."
    : null;

  if (!user) {
    return (
      <div className="h-[640px] rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Sign in to see your schedule.
      </div>
    );
  }

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

      {errorMessage ? (
        <div className="h-[640px] border border-dashed border-rose-300 dark:border-rose-700 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 flex flex-col items-center justify-center gap-3 text-center px-6">
          <p className="text-sm text-rose-600 dark:text-rose-300">{errorMessage}</p>
          <button
            type="button"
            onClick={() => setRefreshToken((x) => x + 1)}
            className="px-3 h-9 rounded-lg border border-rose-300 bg-white text-sm font-semibold text-rose-600 dark:border-rose-600 dark:text-rose-200 dark:bg-transparent"
          >
            Try again
          </button>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="relative border border-gray-200 rounded-2xl bg-white dark:border-gray-700 dark:bg-gray-900"
          style={{ height: 640, overflowY: "auto" }}
        >
          <div className="grid" style={{ gridTemplateColumns: "80px 1fr" }}>
            {/* time ruler */}
            <div className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  className="pr-2 text-right text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800"
                  style={{ height: HOUR_ROW_PX, lineHeight: `${HOUR_ROW_PX}px` }}
                >
                  {new Intl.DateTimeFormat(undefined, {
                    hour: "numeric",
                  }).format(new Date(2000, 0, 1, h))}
                </div>
              ))}
            </div>

            {/* event canvas */}
            <div className="relative border-l border-gray-100 dark:border-gray-800">
              <div
                className="relative"
                style={{ height: 24 * HOUR_ROW_PX }}
              >
                {/* hour grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-b border-gray-100 dark:border-gray-800"
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
      )}
    </div>
  );
}
