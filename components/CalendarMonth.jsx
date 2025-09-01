"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function startOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0,0,0,0);
  return x;
}
function endOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return x;
}
function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7; // Mon=0
  const x = new Date(d);
  x.setDate(d.getDate() - day);
  x.setHours(0,0,0,0);
  return x;
}

export default function CalendarMonth({
  date,
  calendarFilter = "main",
  selectedCalendarIds = [],
}) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  // fetch month events (basic)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const col = collection(db, "users", user.uid, "events");
        // Basic time-range query; if you see “requires index” in console,
        // create the suggested index in Firebase console.
        let q = query(
          col,
          where("start", ">=", Timestamp.fromDate(monthStart)),
          where("start", "<=", Timestamp.fromDate(monthEnd)),
          orderBy("start", "asc")
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Apply calendar filters client-side
        const allowIds = selectedCalendarIds.length
          ? new Set(selectedCalendarIds)
          : null;
        const filtered = rows.filter((e) => {
          const cid = e.calendarId || "main";
          if (calendarFilter !== "all" && cid !== calendarFilter) return false;
          if (allowIds && !allowIds.has(cid)) return false;
          return true;
        });

        setEvents(filtered);
      } catch (e) {
        console.error("CalendarMonth query failed", e);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, monthStart.getTime(), monthEnd.getTime(), calendarFilter, JSON.stringify(selectedCalendarIds)]);

  // compute cells (Mon–Sun)
  const weeks = useMemo(() => {
    const firstVisible = startOfWeek(new Date(monthStart));
    const cells = [];
    let cursor = new Date(firstVisible);
    // 6 weeks grid ensures full month
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  }, [monthStart.getTime()]);

  // group counts per day
  const countByDayKey = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const d = ev.start?.toDate ? ev.start.toDate() : new Date(ev.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [events]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 mb-2">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
          <div key={d} className="px-2 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weeks.map((d, idx) => {
          const inMonth = d.getMonth() === date.getMonth();
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const count = countByDayKey.get(key) || 0;
          return (
            <div
              key={idx}
              className={[
                "min-h-[96px] rounded-xl border p-2 flex flex-col",
                inMonth ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200/70"
              ].join(" ")}
            >
              <div className="text-sm font-semibold text-gray-700">
                {d.getDate()}
              </div>
              {loading ? (
                <div className="mt-2 text-xs text-gray-400">Loading…</div>
              ) : count > 0 ? (
                <div className="mt-1 text-xs">
                  <span className="inline-block rounded-full border border-indigo-300 bg-indigo-50 px-2 py-[2px]">
                    {count} {count === 1 ? "event" : "events"}
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-gray-300">No events</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
