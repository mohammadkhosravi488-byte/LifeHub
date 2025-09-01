"use client";

import { useEffect, useState } from "react";
import { parseIcs } from "@/lib/ics";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ImportPage() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = parseIcs(text).filter((ev) => ev.start && ev.end);
      setEvents(parsed);
      setSavedCount(0);
    } catch (err) {
      console.error(err);
      alert("Failed to parse .ics file");
    }
  };

  const saveAll = async () => {
    if (!user || events.length === 0) return;
    setSaving(true);
    let success = 0;
    for (const ev of events) {
      try {
        await setDoc(
          doc(db, "users", user.uid, "events", ev.uid),
          {
            summary: ev.summary,
            location: ev.location,
            description: ev.description,
            start: Timestamp.fromDate(ev.start),
            end: Timestamp.fromDate(ev.end),
            updatedAt: serverTimestamp(),
            source: "ics",
            calendarId: "main", // default to Main
          },
          { merge: true }
        );
        success++;
        setSavedCount(success);
      } catch (e) {
        console.error("Save failed for", ev.summary, e);
      }
    }
    setSaving(false);
    alert(`Saved ${success} events.`);
  };

  if (!user) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-3">Import Calendar (.ics)</h1>
        <p className="text-gray-800">Please sign in first.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Import Calendar (.ics)</h1>
      <input
        type="file"
        accept=".ics,text/calendar"
        onChange={handleFile}
        className="mb-4"
      />
      {events.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-800">
            Parsed <strong>{events.length}</strong> events.
            {savedCount > 0 && (
              <>
                {" "}
                Saved: <strong>{savedCount}</strong>
              </>
            )}
          </p>
          <button
            onClick={saveAll}
            disabled={saving}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save to my calendar"}
          </button>
        </div>
      )}
    </main>
  );
}
