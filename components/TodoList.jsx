"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
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
  updateDoc,
} from "firebase/firestore";

export default function TodoList({
  calendarFilter = "all",
  search = "",
  selectedCalendarIds = [],
}) {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [calendarId, setCalendarId] = useState("main");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // load todos
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        list.push({
          id: d.id,
          text: data.text || "(untitled task)",
          calendarId: data.calendarId || "main",
          due: data.due?.toDate?.() || null,
          done: !!data.done,
        });
      });
      setTodos(list);
    });
    return () => unsub();
  }, [user]);

  // derived visible list
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selected = selectedCalendarIds.length
      ? new Set(selectedCalendarIds)
      : null;

    return todos.filter((todo) => {
      const cal = todo.calendarId || "main";
      if (calendarFilter !== "all" && cal !== calendarFilter) return false;
      if (selected && !selected.has(cal)) return false;
      if (q && !todo.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [todos, calendarFilter, selectedCalendarIds, search]);

  // actions
  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !user) return;

    setSaving(true);
    try {
      await addDoc(collection(db, "users", user.uid, "todos"), {
        text: value,
        calendarId: calendarId || "main",
        due: due ? new Date(`${due}T23:59:59`) : null,
        done: false,
        createdAt: serverTimestamp(),
      });
      setText("");
      setDue("");
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (id, done) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "todos", id), { done: !done });
  };

  const removeTodo = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "todos", id));
  };

  if (!user) {
    return <p className="text-sm text-gray-500">Sign in to see your to-dos.</p>;
  }

  return (
    <div className="w-full space-y-4">
      {/* add form */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a to-do…"
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
        />
        <select
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-2 text-sm"
        >
          <option value="main">Personal</option>
          {/* more calendars can be injected if you manage them */}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </form>

      {/* list */}
      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">Nothing to show right now.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((todo) => (
            <li
              key={todo.id}
              className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id, todo.done)}
                  className={`text-left flex-1 text-sm ${
                    todo.done
                      ? "line-through text-gray-400"
                      : "text-gray-800"
                  }`}
                >
                  {todo.text}
                </button>
                <button
                  type="button"
                  onClick={() => removeTodo(todo.id)}
                  className="text-red-500 text-xs font-medium hover:underline"
                >
                  Delete
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-[11px] uppercase tracking-wide text-gray-500">
                <span>{todo.calendarId || "main"}</span>
                {todo.due ? (
                  <span>
                    Due {todo.due.toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
