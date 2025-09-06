"use client";

import { useState } from "react";
import { createCalendar, updateShare } from "@/lib/calendars";

export default function CreateCalendarModal({ open, onClose, user }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4f46e5");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [invites, setInvites] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const addInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (invites.some(i => i.email === email)) return;
    setInvites([...invites, { email, role: inviteRole }]);
    setInviteEmail("");
  };

  const removeInvite = (email) => {
    setInvites(invites.filter(i => i.email !== email));
  };

  const handleCreate = async () => {
    setError("");
    if (!name.trim()) { setError("Please enter a calendar name."); return; }
    try {
      setSaving(true);
      const id = await createCalendar({ user, name: name.trim(), color, invites });
      setSaving(false);
      onClose({ created: true, id });
    } catch (e) {
      setSaving(false);
      setError(e.message || "Failed to create.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-[560px] rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create calendar</h3>
          <button onClick={() => onClose(null)} className="px-2 py-1 rounded-md border border-gray-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-900">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              className="mt-1 w-full h-10 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-gray-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Family, Study, Work"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <input
              type="color"
              className="mt-1 h-10 w-16 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Share (optional)</div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Add by email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 h-10 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm text-gray-900 dark:text-gray-100"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-10 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 text-sm text-gray-900 dark:text-gray-100"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                onClick={addInvite}
                className="h-10 px-3 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
              >
                Add
              </button>
            </div>

            {invites.length > 0 && (
              <ul className="mt-2 space-y-1">
                {invites.map((i) => (
                  <li key={i.email} className="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1">
                    <span>{i.email} — {i.role}</span>
                    <button onClick={() => removeInvite(i.email)} className="text-red-600">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onClose(null)}
              className="h-10 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
