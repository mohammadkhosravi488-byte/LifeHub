"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, orderBy, limit, onSnapshot,
} from "firebase/firestore";

export default function Upcoming({ calendarFilter = "all" }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    const col = collection(db, "users", user.uid, "events");
    const now = new Date();

    const constraints = [where("start", ">=", now), orderBy("start", "asc"), limit(20)];
    if (calendarFilter !== "all") {
      constraints.unshift(where("calendarId", "==", calendarFilter));
    }

    const q = query(col, ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      setEvents(list);
    }, (err) => {
      console.error("Upcoming query failed", err);
    });

    return () => unsub && unsub();
  }, [user, calendarFilter]);

  if (!user) return <p className="text-gray-700">Sign in to see upcoming events.</p>;
  if (events.length === 0) return <p className="text-gray-700">No upcoming events.</p>;

  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div key={e.id} className="rounded border p-3 bg-gray-50">
          <div className="font-semibold text-gray-800">{e.summary}</div>
          <div className="text-sm text-gray-700">
            {e.start?.toDate?.().toLocaleString?.() ?? ""}
            {e.end?.toDate?.() ? " → " + e.end.toDate().toLocaleString?.() : ""}
          </div>
          {e.calendarId && (
            <div className="text-xs text-gray-600 mt-1">
              Calendar: {e.calendarId}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
