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
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleFile = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseIcs(text);
      setEvents(parsed);
      setSavedCount(0);
      if (parsed.length === 0) setError("No valid events found in this .ics file.");
    } catch (err) {
      console.error(err);
      setError("Failed to read or parse the .ics file.");
      setEvents([]);
    }
  };

  const saveAll = async () => {
    if (!user || events.length === 0) return;
    setSaving(true);
    setError("");
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
          },
          { merge: true }
        );
        success++;
        setSavedCount(success);
      } catch (e) {
        console.error("Save failed for", ev.summary, e);
        setError(`Save failed: ${String(e?.message || e)}`);
        break; // stop early and show the first error
      }
    }
    setSaving(false);
    if (success > 0 && !error) alert(`Saved ${success} events.`);
  };

  if (!user) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-3">Import Sentral Calendar (.ics)</h1>
        <p className="text-gray-800">Please sign in first.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Import Sentral Calendar (.ics)</h1>

      <input type="file" accept=".ics,text/calendar" onChange={handleFile} />

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {events.length > 0 && (
        <>
          <p className="text-gray-800">
            Parsed <strong>{events.length}</strong> event(s).
            {savedCount > 0 && <> Saved: <strong>{savedCount}</strong></>}
          </p>
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save to my calendar"}
          </button>
        </>
      )}
    </main>
  );
}
