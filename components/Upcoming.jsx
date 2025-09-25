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

export default function Upcoming({
  calendarFilter = "all",
  search = "",
  selectedCalendarIds = [],
}) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Subscribe to upcoming events
  useEffect(() => {
    if (!user) return;
    const now = Timestamp.fromDate(new Date());
    const q = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", now),
      orderBy("start", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        list.push({
          id: d.id,
          summary: data.summary || data.title || "(no title)",
          description: data.description || "",
          location: data.location || "",
          start: data.start?.toDate?.() || new Date(data.start),
          end: data.end?.toDate?.() || (data.end ? new Date(data.end) : null),
          calendarId: data.calendarId || "main",
          allDay: !!data.allDay,
        });
      });
      setEvents(list);
    });
    return () => unsub();
  }, [user]);

  // Filter
  const visible = useMemo(() => {
    const now = new Date();
    const text = search.trim().toLowerCase();
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;

    return events
      .filter((event) => {
        const start = event.start instanceof Date ? event.start : new Date(event.start);
        if (start < now) return false;
        const calId = event.calendarId || "main";
        if (calendarFilter !== "all" && calId !== calendarFilter) return false;
        if (selected && !selected.has(calId)) return false;
        if (text) {
          const haystack = `${event.summary || ""} ${event.description || ""} ${event.location || ""}`.toLowerCase();
          if (!haystack.includes(text)) return false;
        }
        return true;
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 20);
  }, [events, calendarFilter, search, selectedCalendarIds]);

  // Render
  if (!user) {
    return <p className="text-gray-600 text-sm">Sign in to see upcoming events.</p>;
  }
  if (visible.length === 0) {
    return <p className="text-gray-600 text-sm">No upcoming events match the current filters.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
      {visible.map((event) => {
        const start = event.start;
        const end = event.end;
        const timeLabel = event.allDay
          ? start.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            }) + " • All day"
          : `${start.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })} • ${start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}${end ? ` – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`;

        return (
          <li key={event.id} className="py-3 flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {event.summary}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{timeLabel}</div>
              {event.location && (
                <div className="text-xs text-gray-500 dark:text-gray-400">📍 {event.location}</div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {event.calendarId}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
