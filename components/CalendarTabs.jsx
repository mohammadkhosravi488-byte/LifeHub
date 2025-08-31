"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ensureDefaultCalendars, subscribeCalendars } from "@/lib/calendars";

export default function CalendarTabs({ value, onChange }) {
  const [uid, setUid] = useState(null);
  const [calendars, setCalendars] = useState([]);

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid || null)), []);

  useEffect(() => {
    if (!uid) return;
    ensureDefaultCalendars(uid).catch(console.error);
    const unsub = subscribeCalendars(uid, setCalendars);
    return () => unsub && unsub();
  }, [uid]);

  const tabs = [{ id: "all", name: "All" }, ...calendars];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = value === t.id;
        const base =
          "px-3 py-1.5 rounded-full border text-sm transition";
        const inactive =
          "bg-white text-gray-800 border-gray-300 hover:bg-gray-50";
        const activeClass =
          "text-white border-indigo-600";
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`${base} ${active ? activeClass : inactive}`}
            title={t.name}
            style={active && t.color ? { backgroundColor: t.color, borderColor: t.color } : {}}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
