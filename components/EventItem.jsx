"use client";
import { LifehubDataProvider } from "@/lib/data-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { useState } from "react";

export default function EventItem({ user, calendarId, event }) {
  const [loading, setLoading] = useState(false);

  const reschedule = async () => {
    setLoading(true);
    try {
      // 1) Build payload: current busy events for the same day window (you can widen later)
      // For MVP we just pass *no* extra events so server finds an immediate free slot,
      // or you can pass a list you already have loaded.
      const payload = {
        events: [], // pass [] for now; later fill with user's busy blocks
        targetEvent: {
          durationMins: Math.max(15, Math.round((event.end.toDate() - event.start.toDate()) / 60000)),
          earliestISO: event.start.toDate().toISOString(),           // earliest allowed start
          latestISO: new Date(event.end.toDate().getTime() + 7*24*60*60*1000).toISOString(), // within next 7 days
        },
        workHours: { start: 8, end: 18 },
      };

      const resp = await fetch("/api/ai/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "No slot");

      // 2) Apply the proposal to Firestore
      await updateDoc(
        doc(db, "calendars", calendarId, "events", event.id),
        {
          start: Timestamp.fromDate(new Date(data.proposal.startISO)),
          end: Timestamp.fromDate(new Date(data.proposal.endISO)),
          aiReason: data.proposal.reason,
          aiUpdatedAt: Timestamp.now(),
        }
      );
      alert("Rescheduled ✔");
    } catch (e) {
      console.error(e);
      alert("Couldn’t reschedule. Try widening the window.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="rounded-lg border bg-white px-4 py-3">
      <div className="font-medium text-gray-900">{event.summary}</div>
      <div className="text-sm text-gray-700">
        {event.start.toDate().toLocaleString()} → {event.end.toDate().toLocaleString()}
      </div>
      <button
        onClick={reschedule}
        disabled={loading}
        className="mt-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm disabled:opacity-60"
      >
        {loading ? "Thinking…" : "Reschedule with AI"}
      </button>
    </li>
  );
}
