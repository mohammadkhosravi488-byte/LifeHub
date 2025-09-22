"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export default function CalendarTabs({ value, onChange, onCalendarsDiscovered }) {
  const [user] = useAuthState(auth);
  const [calendars, setCalendars] = useState([{ id: "main", name: "Main" }]);

  useEffect(() => {
    if (!user) {
      setCalendars([{ id: "main", name: "Main" }]);
      return;
    }

    const q = query(collection(db, "calendars"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const rows = [{ id: "main", name: "Main" }];
      snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
      setCalendars(rows);
    });

    return () => unsub();
  }, [user]);

  // 🔑 Important: call onCalendarsDiscovered in an effect, not during render
  useEffect(() => {
    if (onCalendarsDiscovered) onCalendarsDiscovered(calendars);
  }, [calendars, onCalendarsDiscovered]);

  return (
    <div className="flex gap-2">
      {calendars.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={[
            "px-3 h-8 rounded-full border text-sm",
            value === c.id
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500"
              : "border-gray-300 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-200",
          ].join(" ")}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
