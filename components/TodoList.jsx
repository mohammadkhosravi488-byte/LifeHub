"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function TodoList({
  calendarFilter = "main",
  search = "",
  selectedCalendarIds = ["main"],
}) {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setTodos([]);
      return;
    }

    // Scope to owner; optionally filter to selected calendars (including main)
    const ids = selectedCalendarIds?.length ? selectedCalendarIds : ["main"];
    const col = collection(db, "todos");
    const q = query(
      col,
      where("ownerId", "==", user.uid),
      where("calendarId", "in", Array.from(new Set(ids)).slice(0, 10)), // Firestore 'in' max 10
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = [];
      snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
      setTodos(rows);
    });

    return () => unsub();
  }, [user, selectedCalendarIds]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return todos;
    return todos.filter((t) => (t.title || "").toLowerCase().includes(term));
  }, [todos, search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    try {
      setAdding(true);
      await addDoc(collection(db, "todos"), {
        title: title.trim(),
        done: false,
        ownerId: user.uid,
        calendarId:
          calendarFilter && calendarFilter !== "all" ? calendarFilter : "main",
        createdAt: serverTimestamp(),
      });
      setTitle("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a to-do…"
          className="flex-1 h-9 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={adding || !title.trim() || !user}
          className="h-9 px-3 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {filtered.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {search ? "No matches." : "No to-dos yet."}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-md border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2"
            >
              <span className="text-sm">{t.title}</span>
              <span className="text-xs text-gray-400">{t.calendarId}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
