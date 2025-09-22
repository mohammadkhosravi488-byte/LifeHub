"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";

/**
 * Props
 * - calendarFilter: "main" | calendarId | "all"
 * - selectedCalendarIds: string[] (optional)
 * - search: string (optional)
 */
export default function TodoList({
  calendarFilter = "main",
  selectedCalendarIds = [],
  search = "",
}) {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Live query: all my tasks (we do client-side filtering to avoid Firestore composite index issues)
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "tasks"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setTasks(arr);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [user]);

  // Filtering in-memory (search + calendars)
  const visible = useMemo(() => {
    let list = tasks;

    // Default to ["main"] if selectedCalendarIds is empty
    const effectiveCalendarIds =
      selectedCalendarIds && selectedCalendarIds.length
        ? selectedCalendarIds
        : ["main"];

    // calendarFilter: main means calendarId is "main" or undefined/null
    if (calendarFilter && calendarFilter !== "all") {
      if (calendarFilter === "main") {
        list = list.filter(
          (t) => !t.calendarId || t.calendarId === "main"
        );
      } else {
        list = list.filter((t) => t.calendarId === calendarFilter);
      }
    }

    if (effectiveCalendarIds?.length) {
      const set = new Set(effectiveCalendarIds);
      list = list.filter((t) => set.has(t.calendarId || "main"));
    }

    if (search?.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(s) ||
          (t.notes || "").toLowerCase().includes(s)
      );
    }

    return list;
  }, [tasks, calendarFilter, selectedCalendarIds, search]);

  async function addTask() {
    const title = input.trim();
    if (!user || !title) return;
    await addDoc(collection(db, "tasks"), {
      title,
      notes: "",
      completed: false,
      ownerId: user.uid,
      calendarId: calendarFilter || "main",
      priority: "none",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setInput("");
  }

  async function toggleComplete(t) {
    await updateDoc(doc(db, "tasks", t.id), {
      completed: !t.completed,
      updatedAt: serverTimestamp(),
    });
  }

  async function remove(t) {
    await deleteDoc(doc(db, "tasks", t.id));
  }

  return (
    <div className="space-y-3">
      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
        />
        <button
          onClick={addTask}
          className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold dark:bg-gray-800 dark:border-gray-700"
        >
          +
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      ) : visible.length ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {visible.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 py-2"
            >
              <input
                type="checkbox"
                checked={!!t.completed}
                onChange={() => toggleComplete(t)}
                className="h-4 w-4"
                aria-label="Complete task"
              />
              <div className="flex-1">
                <div
                  className={`text-sm ${
                    t.completed
                      ? "line-through text-gray-400 dark:text-gray-500"
                      : "text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {t.title}
                </div>
                {t.calendarId && t.calendarId !== "main" && (
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {t.calendarId}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(t)}
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Nothing matches.
        </div>
      )}
    </div>
  );
}
