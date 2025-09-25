"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function Upcoming({
  calendarFilter = "main",
  search = "",
  selectedCalendarIds = [],
}) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setError(null);
      return;
    }

    const now = new Date();
    const ref = collection(db, "users", user.uid, "events");
    const qref = query(
      ref,
      where("start", ">=", Timestamp.fromDate(now)),
      orderBy("start", "asc"),
      limit(50)
    );

    const unsub = onSnapshot(
      qref,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvents(rows);
        setError(null);
      },
      (err) => {
        console.error("Upcoming query failed", err);
        setEvents([]);
        setError(err);
      }
    );

    return () => unsub();
  }, [user, refreshToken]);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    const selected = new Set(selectedCalendarIds || []);

    return events.filter((ev) => {
      const calId = ev.calendarId || "main";
      if (calendarFilter !== "all" && calId !== calendarFilter) return false;
      if (selected.size > 0 && !selected.has(calId)) return false;

      if (text) {
        const hay =
          `${ev.summary || ""} ${ev.description || ""} ${ev.location || ""}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });
  }, [events, calendarFilter, search, selectedCalendarIds]);

  const errorMessage = error
    ? error.code === "permission-denied"
      ? "We don’t have permission to load your upcoming events."
      : "We couldn’t load your upcoming events."
    : null;

  if (!user)
    return <p className="text-gray-600 dark:text-gray-400 text-sm">Sign in to see upcoming.</p>;

  if (errorMessage) {
    return (
      <div className="border border-dashed border-rose-300 dark:border-rose-700 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 flex flex-col items-center justify-center gap-3 text-center px-4 py-6">
        <p className="text-sm text-rose-600 dark:text-rose-300">{errorMessage}</p>
        <button
          type="button"
          onClick={() => setRefreshToken((x) => x + 1)}
          className="px-3 h-9 rounded-lg border border-rose-300 bg-white text-sm font-semibold text-rose-600 dark:border-rose-600 dark:text-rose-200 dark:bg-transparent"
        >
          Try again
        </button>
      </div>
    );
  }

  if (visible.length === 0)
    return <p className="text-gray-600 dark:text-gray-400 text-sm">No upcoming items match.</p>;

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
      {visible.map((ev) => {
        const start = ev.start?.toDate?.() || new Date(ev.start);
        const end = ev.end?.toDate?.();
        const time = ev.allDay
          ? "All day"
          : `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}${end ? " – " + end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}`;

        return (
          <li key={ev.id} className="py-2 flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{ev.summary || "(no title)"}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
              {ev.location && (
                <div className="text-xs text-gray-500 dark:text-gray-400">📍 {ev.location}</div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{ev.calendarId || "main"}</div>
          </li>
        );
      })}
    </ul>
  );
}
