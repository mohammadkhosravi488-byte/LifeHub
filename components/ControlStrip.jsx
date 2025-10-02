"use client";
import { LifehubDataProvider } from "@/lib/data-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export default function ControlStrip({
  value,                // "main" | calendarId | "all"
  onChange,             // (id) => void
  showAllTab = true,    // set false if you don’t want the All pill
  onFilterOpen,         // () => void
}) {
  const [user, setUser] = useState(null);
  const [calendars, setCalendars] = useState([
    { id: "main", name: "Main", color: "#4f46e5" },
  ]);

  // Local state for “New Calendar” modal
  const [openNew, setOpenNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#4f46e5");
  const [saving, setSaving] = useState(false);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Load user calendars from users/{uid}/calendars
  useEffect(() => {
    if (!user) {
      // Only show implicit Main when logged out
      setCalendars([{ id: "main", name: "Main", color: "#4f46e5" }]);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "calendars"),
      where("ownerId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const extra = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        // Skip implicit Main if user created one named "Main"
        if ((data.name || "").trim().toLowerCase() === "main") return;
        extra.push({
          id: d.id,
          name: data.name || d.id,
          color: data.color || "#64748b",
        });
      });

      const base = [{ id: "main", name: "Main", color: "#4f46e5" }];
      const uniqueById = new Map(base.concat(extra).map((c) => [c.id, c]));
      const list = Array.from(uniqueById.values());

      // Optionally prepend an “All” pill
      setCalendars(showAllTab ? [{ id: "all", name: "All" }, ...list] : list);
    });

    return () => unsub();
  }, [user, showAllTab]);

  // Inline search -> broadcast so Calendar/Upcoming/Todos can listen
  const handleSearch = (txt) => {
    const ev = new CustomEvent("lifehub:search", { detail: txt });
    window.dispatchEvent(ev);
  };

  // Create calendar
  const handleCreate = async (e) => {
    e?.preventDefault?.();
    if (!user || !newName.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "users", user.uid, "calendars"), {
        name: newName.trim(),
        color: newColor,
        ownerId: user.uid,
        members: [{ id: user.uid, role: "owner" }],
        isShared: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setOpenNew(false);
      setNewName("");
    } catch (err) {
      console.error(err);
      alert("Failed to create calendar.");
    } finally {
      setSaving(false);
    }
  };

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
              const isActive = value === c.id || (!value && c.id === "main");
              return (
                <button
                  key={c.id}
                  onClick={() => onChange?.(c.id)}
                  className={[
                    "h-8 px-4 rounded-[12px] border text-sm",
                    "bg-white border-[var(--outline-neutral)]",
                    isActive ? "font-bold" : "text-[var(--ink-muted)]",
                  ].join(" ")}
                  title={c.name}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-4">
          {/* New Calendar */}
          <button
            onClick={() => setOpenNew(true)}
            className="h-8 px-3 rounded-[16px] border border-[var(--outline-neutral)] bg-white text-sm font-semibold"
            title={user ? "Create a new calendar" : "Sign in to create calendars"}
            disabled={!user}
          >
            + New Calendar
          </button>

          {/* Import */}
          <Link
            href="/import"
            className="h-8 px-3 rounded-[12px] border border-[var(--outline-neutral)] bg-white text-sm flex items-center"
            title="Import .ics"
          >
            Import .ics
          </Link>

          {/* Search */}
          <input
            id="__lh_search"
            placeholder="Search…"
            className="w-[320px] h-8 rounded-[12px] border border-[var(--outline-neutral)] px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            onChange={(e) => handleSearch(e.target.value)}
          />

          {/* Filters */}
          <button
            aria-label="Open filters"
            onClick={onFilterOpen}
            className="h-8 w-8 rounded-[8px] border border-[var(--outline-neutral)] bg-white"
            title="Filters"
          >
            ⌯
          </button>
        </div>
      </div>

      {/* New Calendar Modal */}
      {openNew && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => !saving && setOpenNew(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-4 shadow-lg"
          >
            <div className="text-lg font-semibold mb-3">Create Calendar</div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Family, Study, Work"
              className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">
              Color
            </label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-16 h-8 p-0 border border-gray-300 rounded-md"
              aria-label="Calendar color"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenNew(false)}
                className="h-8 px-3 rounded-md border border-gray-300 text-sm bg-white"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !newName.trim()}
                className="h-8 px-3 rounded-md bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
