"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";

export default function AddEvent() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!user || !summary || !start || !end) return;

    setSaving(true);
    try {
      await addDoc(collection(db, "users", user.uid, "events"), {
        summary,
        start: Timestamp.fromDate(new Date(start)),
        end: Timestamp.fromDate(new Date(end)),
        createdAt: serverTimestamp(),
        source: "manual",
      });
      setSummary("");
      setStart("");
      setEnd("");
      alert("Event added ✔");
    } catch (err) {
      console.error(err);
      alert("Could not save event.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <p className="text-gray-700">Sign in to add events.</p>;

  return (
    <form onSubmit={save} className="w-full max-w-md space-y-3">
      <input
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Event title (e.g., Maths test)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-3">
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-60"
      >
        {saving ? "Saving…" : "Add Event"}
      </button>
    </form>
  );
}
