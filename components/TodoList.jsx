"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function TodoList({
  calendarFilter = "main",
  selectedCalendarIds = [],
  search = "",
}) {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState("");
  const [due, setDue] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const col = collection(db, "users", user.uid, "todos");
    const q = query(col, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        setTasks(rows);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load todos", error);
        setTasks([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const visible = useMemo(() => {
    let list = tasks;

    const effectiveSelection = selectedCalendarIds?.length
      ? selectedCalendarIds
      : ["main"];

    if (calendarFilter && calendarFilter !== "all") {
      list = list.filter((t) => (t.calendarId || "main") === calendarFilter);
    }

    if (effectiveSelection?.length) {
      const set = new Set(effectiveSelection);
      list = list.filter((t) => set.has(t.calendarId || "main"));
    }

    if (search?.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((t) => {
        const haystack = `${t.title || ""} ${t.notes || ""}`.toLowerCase();
        return haystack.includes(s);
      });
    }

    return list;
  }, [tasks, calendarFilter, selectedCalendarIds, search]);

  const resolveCalendarForNewTask = () => {
    if (calendarFilter && calendarFilter !== "all") return calendarFilter;
    if (selectedCalendarIds?.length) return selectedCalendarIds[0];
    return "main";
  };

  async function addTask(e) {
    e?.preventDefault?.();
    const title = input.trim();
    if (!user || !title) return;

    const payload = {
      title,
      notes: "",
      completed: false,
      calendarId: resolveCalendarForNewTask(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (due) {
      const dueDate = new Date(`${due}T00:00:00`);
      if (!Number.isNaN(dueDate.getTime())) {
        payload.due = Timestamp.fromDate(dueDate);
      }
    }

    try {
      await addDoc(collection(db, "users", user.uid, "todos"), payload);
      setInput("");
      setDue("");
    } catch (error) {
      console.error("Failed to create todo", error);
    }
  }

  async function toggleComplete(task) {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid, "todos", task.id), {
        completed: !task.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to toggle todo", error);
    }
  }

  async function remove(task) {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "todos", task.id));
    } catch (error) {
      console.error("Failed to delete todo", error);
    }
  }

  if (!user) {
    return <p className="text-sm text-gray-500">Sign in to manage tasks.</p>;
  }

  return (
    <div className="space-y-3">
      <form onSubmit={addTask} className="flex flex-wrap gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 min-w-[160px] h-9 rounded-lg border border-gray-300 px-3 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 px-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          aria-label="Due date"
        />
        <button
          type="submit"
          className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold dark:bg-gray-800 dark:border-gray-700"
        >
          Add
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      ) : visible.length ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {visible.map((t) => {
            const dueDate = t.due?.toDate?.() || (t.due ? new Date(t.due) : null);
            return (
              <li key={t.id} className="flex items-center gap-3 py-2">
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
                  <div className="flex gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    {t.calendarId && t.calendarId !== "main" && <span>{t.calendarId}</span>}
                    {dueDate && (
                      <span>
                        Due {dueDate.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(t)}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">Nothing matches.</div>
      )}
    </div>
  );
}
