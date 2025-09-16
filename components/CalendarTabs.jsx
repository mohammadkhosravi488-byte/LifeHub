"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import DarkModeToggle from "@/components/DarkModeToggle";


/**
 * Props
 * - value: string ("main" | calendarId)
 * - onChange: (id: string) => void
 * - onCalendarsDiscovered?: (list: {id,name,color}[]) => void
 */
export default function CalendarTabs({ value, onChange, onCalendarsDiscovered }) {
  const [user, setUser] = useState(null);
  const [owned, setOwned] = useState([]);
  const [memberOf, setMemberOf] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Owned calendars
  useEffect(() => {
    if (!user) {
      setOwned([]);
      return;
    }
    const q = query(collection(db, "calendars"), where("ownerId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        if ((data.name || "").toLowerCase() === "main") return; // we render Main implicitly
        arr.push({ id: d.id, name: data.name || d.id, color: data.color || "#888" });
      });
      setOwned(arr);
    });
    return () => unsub();
  }, [user]);

  // Shared calendars (membership)
  useEffect(() => {
    if (!user) {
      setMemberOf([]);
      return;
    }
    const q = query(collection(db, "calendars"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        if ((data.name || "").toLowerCase() === "main") return;
        arr.push({ id: d.id, name: data.name || d.id, color: data.color || "#888" });
      });
      setMemberOf(arr);
    });
    return () => unsub();
  }, [user]);

  const calendars = useMemo(() => {
    const map = new Map();
    map.set("main", { id: "main", name: "Main" });
    for (const c of owned) map.set(c.id, c);
    for (const c of memberOf) map.set(c.id, c);
    const list = Array.from(map.values());
    onCalendarsDiscovered?.(list);
    return list;
  }, [owned, memberOf, onCalendarsDiscovered]);

  return (
    <div className="flex items-center gap-2">
      {calendars.map((c) => {
        const active = value === c.id || (value === "all" && c.id === "main");
        return (
          <button
            key={c.id}
            onClick={() => onChange?.(c.id)}
            className={`h-8 px-4 rounded-[12px] border text-sm transition ${
              active
                ? "bg-white border-gray-300 font-semibold dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                : "bg-white border-gray-300 text-gray-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
            }`}
            title={c.name}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
