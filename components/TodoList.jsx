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

  const addTodo = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!user || !t) return;
    await addDoc(collection(db, "users", user.uid, "todos"), {
      text: t,
      done: false,
      createdAt: serverTimestamp(),
    });
    setText("");
  };

  const toggleDone = async (id, done) => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "todos", id), { done: !done });
  };

  const removeTodo = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "todos", id));
  };

  if (!user) {
    return (
      <p className="text-gray-600 text-sm">
        Sign in to create your to-dos.
      </p>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <form onSubmit={addTodo} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a to-do…"
          className="flex-1 rounded-lg border px-3 py-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </form>

      <ul className="space-y-2">
  {todos.map((t) => (
    <li
      key={t.id}
      className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3 hover:bg-gray-100 transition"
    >
      <button
        onClick={() => toggleDone(t.id, t.done)}
        className={`text-left flex-1 ${
          t.done ? "line-through text-gray-400" : "text-gray-800"
        }`}
      >
        {t.text}
      </button>
      <button
        onClick={() => removeTodo(t.id)}
        className="text-red-500 text-sm hover:underline"
      >
        Delete
      </button>
    </li>
  ))}
</ul>

    </div>
  );
}
