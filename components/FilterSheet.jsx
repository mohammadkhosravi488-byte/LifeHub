"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function FilterSheet({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [cals, setCals] = useState([]);
  const [busyOnly, setBusyOnly] = useState(false);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "calendars"), where("ownerId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const arr = [{ id: "main", name: "Main" }];
      snap.forEach((d) => arr.push({ id: d.id, name: d.data().name }));
      setCals(arr);
    });
  }, [user]);

  useEffect(() => {
    if (!open) return;
    // broadcast current filters
    const ev = new CustomEvent("lifehub:filters", {
      detail: { calendars: Array.from(selected), busyOnly },
    });
    window.dispatchEvent(ev);
  }, [open, selected, busyOnly]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-end">
      <div className="w-[340px] bg-white h-full p-4 border-l border-[var(--outline-neutral)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Filters</h3>
          <button onClick={onClose} className="px-2 py-1 border rounded">Close</button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-[var(--ink-muted)] mb-1">Calendars</div>
            {cals.map((c) => (
              <label key={c.id} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(c.id) : next.delete(c.id);
                    setSelected(next);
                  }}
                />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={busyOnly}
              onChange={(e) => setBusyOnly(e.target.checked)}
            />
            <span className="text-sm">Only busy items</span>
          </label>
        </div>
      </div>
    </div>
  );
}
