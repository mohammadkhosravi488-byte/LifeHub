"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Upcoming() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const now = new Date();

    const q = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", now),
      orderBy("start", "asc"),
      limit(5) // show next 5 events
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(items);
    });

    return () => unsub();
  }, [user]);

  if (!user) {
    return <p className="text-gray-700">Please sign in to see events.</p>;
  }

  if (events.length === 0) {
    return <p className="text-gray-700">No upcoming events.</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li key={e.id} className="rounded-lg border bg-white px-4 py-3">
          <div className="font-medium text-gray-900">{e.summary}</div>
          <div className="text-sm text-gray-700">
            {e.start?.toDate?.().toLocaleString?.() || ""}
            {e.end?.toDate && " → " + e.end.toDate().toLocaleString()}
          </div>
          {e.location && (
            <div className="text-sm text-gray-700">Room: {e.location}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
