"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const BASE_CALENDARS = Object.freeze([{ id: "main", name: "Main" }]);

export default function CalendarTabs({ value, onChange, onCalendarsDiscovered }) {
  const [user, setUser] = useState(null);
  const [calendars, setCalendars] = useState(() => [...BASE_CALENDARS]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setCalendars(() => [...BASE_CALENDARS]);
      return;
    }

    const q = query(collection(db, "calendars"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = [...BASE_CALENDARS];
        snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
        setCalendars(rows);
      },
      (error) => {
        console.error("Failed to load calendars", error);
        setCalendars(() => [...BASE_CALENDARS]);
      }
    );

    return () => unsub();
  }, [user]);

  const tabs = useMemo(() => {
    const unique = new Map();
    calendars.forEach((c) => {
      if (!unique.has(c.id)) unique.set(c.id, c);
    });
    const arr = Array.from(unique.values());
    return [{ id: "all", name: "All" }, ...arr];
  }, [calendars]);

  useEffect(() => {
    if (!onCalendarsDiscovered) return;
    const discovered = calendars.map((c) => ({ id: c.id, name: c.name }));
    onCalendarsDiscovered(discovered);
  }, [calendars, onCalendarsDiscovered]);

  return (
    <div className="flex gap-2">
      {tabs.map((c) => (
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
