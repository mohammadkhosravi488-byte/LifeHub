"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import ShareCalendar from "./ShareCalendar";

export default function CreateCalendarModal({ open, onClose, user }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4f46e5");
  const [members, setMembers] = useState([]); // list of { email, role }
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const onCreate = async () => {
    if (!user || !name.trim()) return;
    try {
      setBusy(true);
      const ref = await addDoc(collection(db, "calendars"), {
        name: name.trim(),
        color,
        ownerId: user.uid,
        members: [
          { id: user.uid, role: "owner" },
          ...members.map((m) => ({ email: m.email, role: m.role || "viewer" })),
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setBusy(false);
      onClose?.({ created: true, id: ref.id });
      setName("");
      setMembers([]);
    } catch (e) {
      console.error(e);
      setBusy(false);
      onClose?.({ created: false, error: String(e) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        <h3 className="text-lg font-semibold mb-3">Create Calendar</h3>
        
        {/* Calendar Details */}
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Calendar name"
            className="w-full h-10 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm">Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>

        {/* Sharing */}
        <div className="mt-4">
          <ShareCalendar members={members} setMembers={setMembers} />
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => onClose?.({ created: false })}
            className="h-9 px-3 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
          >
            Cancel
          </button>
          <button
            disabled={busy || !name.trim()}
            onClick={onCreate}
            className="h-9 px-4 rounded-md bg-indigo-600 text-white text-sm disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
