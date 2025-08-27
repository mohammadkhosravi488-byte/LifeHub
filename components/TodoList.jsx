"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function TodoList() {
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [todos, setTodos] = useState([]);

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Watch the user's todos in real-time
  useEffect(() => {
    if (!user) {
      setTodos([]);
      return;
    }
    const q = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTodos(items);
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
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {todos.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"
          >
            <button
              onClick={() => toggleDone(t.id, t.done)}
              className={`text-left flex-1 ${
                t.done ? "line-through text-gray-400" : ""
              }`}
              title="Toggle done"
            >
              {t.text}
            </button>
            <button
              onClick={() => removeTodo(t.id)}
              className="text-red-600 text-sm"
              title="Delete"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
