"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function CalendarDay() {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "events"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  const addEvent = async () => {
    if (!newEvent.trim() || !user) return;
    await addDoc(collection(db, "events"), {
      title: newEvent,
      date: new Date().toISOString().split("T")[0], // today
      uid: user.uid,
      createdAt: Date.now(),
    });
    setNewEvent("");
  };

  if (!user) return <p className="text-gray-500">Sign in to see your events.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={newEvent}
          onChange={(e) => setNewEvent(e.target.value)}
          placeholder="New event..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm"
        />
        <button
          onClick={addEvent}
          className="px-3 rounded-md bg-indigo-600 text-white text-sm"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="px-3 py-1 border rounded-md">
            {e.title} – {e.date}
          </li>
        ))}
      </ul>
    </div>
  );
}
