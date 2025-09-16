"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function CreateCalendarModal({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4f46e5");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (open) {
      setName("");
      setColor("#4f46e5");
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  async function create() {
    if (!user) return;
    const n = name.trim();
    if (!n) return;

    setSaving(true);
    await addDoc(collection(db, "calendars"), {
      name: n,
      color,
      ownerId: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setSaving(false);
    onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-[420px] rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:bg-gray-900 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Create calendar</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Name</label>
            <input
              className="mt-1 w-full h-9 rounded-lg border border-gray-300 px-3 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              placeholder="e.g. Family, Work, Study…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Color</label>
            <input
              type="color"
              className="mt-1 h-9 w-16 rounded border border-gray-300 bg-white p-1 dark:bg-gray-800 dark:border-gray-700"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm dark:bg-gray-800 dark:border-gray-700"
            onClick={() => onClose?.()}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
            onClick={create}
            disabled={saving}
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
