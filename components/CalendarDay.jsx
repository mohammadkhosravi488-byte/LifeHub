"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val.toDate) return val.toDate();
  return new Date(val);
}

export default function CalendarDay({ date = new Date() }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [newEvent, setNewEvent] = useState("");
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "events"),
      where("start", ">=", Timestamp.fromDate(start)),
      where("start", "<=", Timestamp.fromDate(end))
    );
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data(), start: toDate(d.data().start) })));
    });
  }, [user, start.getTime(), end.getTime()]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users", user.uid, "todos"), (snap) => {
      setTodos(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data(), due: toDate(d.data().due) }))
          .filter((t) => t.due && t.due.toDateString() === date.toDateString())
      );
    });
  }, [user, date.toDateString()]);

  const addEvent = async () => {
    if (!newEvent.trim() || !user) return;
    await addDoc(collection(db, "users", user.uid, "events"), {
      title: newEvent,
      start: Timestamp.fromDate(date),
      end: Timestamp.fromDate(date),
      createdAt: Timestamp.now(),
    });
    setNewEvent("");
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;
    await addDoc(collection(db, "users", user.uid, "todos"), {
      text: newTodo,
      due: Timestamp.fromDate(date),
      completed: false,
      createdAt: Timestamp.now(),
    });
    setNewTodo("");
  };

  if (!user) return <p className="text-gray-500">Sign in to see day view.</p>;

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
        {date.toDateString()}
      </h2>

      <div className="flex gap-2 mb-3">
        <input
          value={newEvent}
          onChange={(e) => setNewEvent(e.target.value)}
          placeholder="New event"
          className="flex-1 rounded-md border px-2 py-1 text-sm"
        />
        <button onClick={addEvent} className="bg-indigo-600 text-white text-sm px-3 rounded-md">
          Add Event
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New task"
          className="flex-1 rounded-md border px-2 py-1 text-sm"
        />
        <button onClick={addTodo} className="bg-indigo-600 text-white text-sm px-3 rounded-md">
          Add Todo
        </button>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Events</h3>
        <ul className="space-y-1">
          {events.map((ev) => (
            <li key={ev.id} className="text-sm text-gray-800 dark:text-gray-100">
              • {ev.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Todos</h3>
        <ul className="space-y-1">
          {todos.map((td) => (
            <li key={td.id} className="text-sm text-gray-800 dark:text-gray-100">
              • {td.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
