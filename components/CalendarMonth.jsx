"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

function matchesSearch(item, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    (item.title || item.summary || "").toLowerCase().includes(s) ||
    (item.location || "").toLowerCase().includes(s) ||
    (item.notes || item.description || "").toLowerCase().includes(s)
  );
}

// Very simple month view placeholder that lists items by day.
// (Your day-grid UI can replace this later; this keeps logic correct.)
export default function CalendarMonth({ calendarId = "main", searchQuery = "" }) {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    (async () => {
      const col = collection(db, "users", user.uid, "events");
      // Simple order; filter client-side to avoid composite index errors.
      const snap = await getDocs(query(col, orderBy("start")));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [user]);

  const visible = useMemo(() => {
    return items.filter((it) => {
      const cal = it.calendarId ?? "main";
      const calOk = calendarId === "all" ? true : cal === calendarId;
      return calOk && matchesSearch(it, searchQuery);
    });
  }, [items, calendarId, searchQuery]);

  if (!user) return <p className="text-gray-600">Sign in to see your calendar.</p>;
  if (visible.length === 0) return <p className="text-gray-600">No events in this range.</p>;

  return (
    <div className="space-y-2">
      {visible.map((e) => {
        const start = e.start?.toDate ? e.start.toDate() : new Date(e.start);
        const end = e.end?.toDate ? e.end.toDate() : new Date(e.end);
        return (
          <div key={e.id} className="rounded-lg border border-gray-200 p-3 bg-white">
            <div className="text-sm font-semibold text-gray-900">
              {e.title || e.summary || "Untitled"}
            </div>
            <div className="text-xs text-gray-600">
              {start.toLocaleString()} → {end.toLocaleString()}
              {e.location ? ` • ${e.location}` : ""}
              {e.calendarId ? ` • ${e.calendarId}` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
