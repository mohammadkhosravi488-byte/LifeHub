"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function ControlStrip({
  value,
  onChange,
  onAddCalendar,
  onSearchOpen,
  onFilterOpen,
}) {
  const [user, setUser] = useState(null);
  const [calendars, setCalendars] = useState([
    { id: "main", name: "Main", color: "#4f46e5" },
  ]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "calendars"),
      where("ownerId", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const extra = [];
      snap.forEach((d) => {
        // Skip implicit main if user created one named Main
        if ((d.data().name || "").toLowerCase() === "main") return;
        extra.push({ id: d.id, name: d.data().name, color: d.data().color });
      });
      setCalendars([{ id: "main", name: "Main" }, ...extra]);
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 mt-4">
      <div className="h-14 flex items-center justify-between border-b border-[var(--outline-neutral)]">
        {/* Left cluster */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--ink-muted)]">
            Select Calendar:
          </span>

          <div className="flex items-center gap-2">
            {calendars.map((c) => {
              const active = value === c.id || (value === "all" && c.id === "main");
              return (
                <button
                  key={c.id}
                  onClick={() => onChange(c.id)}
                  className={`h-8 px-4 rounded-[12px] border text-sm ${
                    active
                      ? "bg-white border-[var(--outline-neutral)] font-bold"
                      : "bg-white border-[var(--outline-neutral)] text-[var(--ink-muted)]"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-4">
          <button
            onClick={onAddCalendar}
            className="h-8 w-[72px] rounded-[16px] border border-[var(--outline-neutral)] bg-white text-sm font-semibold"
          >
            Add
          </button>
          <Link
          href="/import"
          className="h-8 px-3 rounded-[12px] border border-[var(--outline-neutral)] bg-white text-sm flex items-center"
          >
            Import .ics
          </Link>


          {/* Simple inline search (works now) */}
          <input
            id="__lh_search"
            placeholder="Search…"
            className="w-[320px] h-8 rounded-[12px] border border-[var(--outline-neutral)] px-3 text-sm"
            onChange={(e) => {
              const ev = new CustomEvent("lifehub:search", {
                detail: e.target.value,
              });
              window.dispatchEvent(ev);
            }}
          />

          <button
            aria-label="Open filters"
            onClick={onFilterOpen}
            className="h-8 w-8 rounded-[8px] border border-[var(--outline-neutral)]"
          >
            ⌯
          </button>
        </div>
      </div>
    </div>
  );
}
