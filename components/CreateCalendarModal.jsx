"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function CreateCalendarModal({ open, onClose, user }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4f46e5");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setColor("#4f46e5");
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  const handleCreate = async () => {
    if (!user || !name.trim()) {
      onClose?.({ created: false });
      return;
    }
    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, "calendars"), {
        name: name.trim(),
        color,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      const calendar = { id: docRef.id, name: name.trim(), color };
      onClose?.({ created: true, calendar });
    } catch (e) {
      console.error(e);
      onClose?.({ created: false, error: String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <h3 className="text-lg font-semibold mb-3">Create calendar</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">Name</label>
            <input
              className="w-full h-9 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Color</label>
            <input
              type="color"
              className="h-9 w-16 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => onClose?.({ created: false })}
            className="h-9 px-3 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="h-9 px-3 rounded-md border border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/30 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
