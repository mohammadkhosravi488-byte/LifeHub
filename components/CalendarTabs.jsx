"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { LifehubDataProvider } from "@/lib/data-context";
export default function CalendarTabs({ value, onChange, onCalendarsDiscovered }) {
  const [user, setUser] = useState(null);
  const [calendars, setCalendars] = useState([{ id: "main", name: "Main" }]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setCalendars([{ id: "main", name: "Main" }]);
      onCalendarsDiscovered?.([{ id: "main", name: "Main" }]);
      return;
    }
    const q = query(collection(db, "calendars"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = [{ id: "main", name: "Main" }];
      snap.forEach((d) => {
        const data = d.data();
        // Avoid duplicating "Main"
        if ((data.name || "").toLowerCase() === "main") return;
        list.push({ id: d.id, name: data.name || d.id, color: data.color });
      });
      setCalendars(list);
      onCalendarsDiscovered?.(list);
    });
    return () => unsub();
  }, [user, onCalendarsDiscovered]);

  return (
    <div className="flex items-center gap-2">
      {calendars.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onChange?.(c.id)}
            className={`h-8 px-4 rounded-[12px] border text-sm ${
              active
                ? "bg-white border-gray-300 dark:border-neutral-700 font-semibold"
                : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-500"
            }`}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
