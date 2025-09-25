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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return setEvents([]);

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
      },
      (err) => {
        console.error("Upcoming query failed", err);
      }
    );

    return () => unsub();
  }, [user]);

  // Filter
  const visible = useMemo(() => {
    const now = new Date();
    const text = search.trim().toLowerCase();
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;

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

  if (!user) return <p className="text-gray-600 text-sm">Sign in to see upcoming.</p>;
  if (visible.length === 0) return <p className="text-gray-600 text-sm">No upcoming items match.</p>;

  return (
    <ul className="divide-y divide-gray-200">
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
          <li key={event.id} className="py-3 flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-gray-900">{ev.summary || "(no title)"}</div>
              <div className="text-xs text-gray-500">{time}</div>
              {ev.location && <div className="text-xs text-gray-500">📍 {ev.location}</div>}
            </div>
            <div className="text-xs text-gray-500">{ev.calendarId || "main"}</div>
          </li>
        );
      })}
    </ul>
  );
}
