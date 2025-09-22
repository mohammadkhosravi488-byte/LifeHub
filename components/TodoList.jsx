"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function TodoList() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTodos(list);
    });
    return () => unsub();
  }, [user]);

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !user) return;
    await addDoc(collection(db, "users", user.uid, "todos"), {
      text: newTodo,
      completed: false,
      createdAt: Timestamp.now(),
      calendarId: "main",
    });
    setNewTodo("");
  };

  const toggleComplete = async (id, current) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "todos", id);
    await updateDoc(ref, { completed: !current });
  };

  if (!user) return <p className="text-gray-500">Sign in to manage todos.</p>;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex gap-2 mb-3">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New task"
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
        />
        <button
          onClick={handleAddTodo}
          className="px-3 rounded-md bg-indigo-600 text-white text-sm"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map((td) => (
          <li
            key={td.id}
            className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded"
          >
            <span
              className={`text-sm ${
                td.completed ? "line-through text-gray-500" : "text-gray-800 dark:text-gray-100"
              }`}
            >
              {td.text}
            </span>
            <button
              onClick={() => toggleComplete(td.id, td.completed)}
              className="text-xs text-indigo-600 dark:text-indigo-400"
            >
              {td.completed ? "Undo" : "Done"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
