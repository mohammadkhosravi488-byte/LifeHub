"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function TodoList({
  calendarFilter = "main",
  search = "",
  selectedCalendarIds = [],
}) {
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return setItems([]);
    const ref = collection(db, "users", user.uid, "tasks");
    const qref = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qref, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const visible = useMemo(() => {
    const textq = search.trim().toLowerCase();
    const selected = new Set(selectedCalendarIds || []);
    return items.filter((t) => {
      const calId = t.calendarId || "main";

      // Tab filter (keep default "main" simple)
      if (calendarFilter !== "all" && calId !== calendarFilter) return false;

      // Multi-select chips (only apply if user actually picked some)
      if (selected.size > 0 && !selected.has(calId)) return false;

      if (textq) {
        const hay = `${t.title || ""}`.toLowerCase();
        if (!hay.includes(textq)) return false;
      }
      return true;
    });
  }, [items, calendarFilter, search, selectedCalendarIds]);

  async function addTask() {
    if (!user || !text.trim()) return;
    const ref = collection(db, "users", user.uid, "tasks");
    await addDoc(ref, {
      title: text.trim(),
      completed: false,
      calendarId: calendarFilter || "main",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setText("");
  }

  async function toggleTask(t) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "tasks", t.id), {
      completed: !t.completed,
      updatedAt: serverTimestamp(),
    });
  }

  async function removeTask(t) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "tasks", t.id));
  }

  if (!user) {
    return <p className="text-gray-600 text-sm">Sign in to manage to-dos.</p>;
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={addTask}
          className="h-10 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
        >
          Add
        </button>
      </div>

      <ul className="divide-y divide-gray-200">
        {visible.map((t) => (
          <li key={t.id} className="py-2 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!t.completed}
                onChange={() => toggleTask(t)}
              />
              <span
                className={[
                  "text-sm",
                  t.completed ? "line-through text-gray-400" : "text-gray-900",
                ].join(" ")}
              >
                {t.title}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {t.calendarId || "main"}
              </span>
              <button
                className="text-xs text-red-600"
                onClick={() => removeTask(t)}
              >
                delete
              </button>
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-2 text-sm text-gray-500">Nothing matches.</li>
        )}
      </ul>
    </div>
  );
}
