"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
} from "firebase/firestore";

export default function TodoList() {
  const [user] = useAuthState(auth);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "todos"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setTodos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;
    await addDoc(collection(db, "todos"), {
      text: newTodo,
      done: false,
      uid: user.uid,
      createdAt: Date.now(),
    });
    setNewTodo("");
  };

  const toggleDone = async (id, done) => {
    await updateDoc(doc(db, "todos", id), { done: !done });
  };

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, "todos", id));
  };

  if (!user) return <p className="text-gray-500">Sign in to manage todos.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New task..."
          className="flex-1 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm"
        />
        <button
          onClick={addTodo}
          className="px-3 rounded-md bg-indigo-600 text-white text-sm"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos.map((t) => (
          <li
            key={t.id}
            className="flex justify-between items-center px-3 py-1 rounded-md border border-gray-200 dark:border-neutral-700"
          >
            <span
              onClick={() => toggleDone(t.id, t.done)}
              className={`flex-1 cursor-pointer ${
                t.done ? "line-through text-gray-500" : ""
              }`}
            >
              {t.text}
            </span>
            <button
              onClick={() => deleteTodo(t.id)}
              className="text-red-500 text-xs ml-2"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
