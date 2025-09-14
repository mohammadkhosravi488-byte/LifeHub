"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc, collection, onSnapshot, orderBy,
  query, serverTimestamp, where
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function TodoList({ calendarFilter = "main", search = "", selectedCalendarIds = [] }) {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // live tasks for this user
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setRows(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const visible = useMemo(() => {
    let list = rows;

    // filter by calendar(s)
    const calendarsActive = selectedCalendarIds.length > 0 ? selectedCalendarIds : [calendarFilter || "main"];
    if (calendarsActive[0] !== "all") {
      list = list.filter((t) => calendarsActive.includes(t.calendarId || "main"));
    }

    // search
    const q = (search || "").trim().toLowerCase();
    if (q) {
      list = list.filter((t) => (t.title || "").toLowerCase().includes(q));
    }

    return list;
  }, [rows, calendarFilter, selectedCalendarIds, search]);

  const onAdd = async () => {
    if (!user || !title.trim()) return;
    const calId = (selectedCalendarIds[0] || calendarFilter || "main") === "all"
      ? "main"
      : (selectedCalendarIds[0] || calendarFilter || "main");

    await addDoc(collection(db, "tasks"), {
      userId: user.uid,
      calendarId: calId,
      title: title.trim(),
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      tags: [],
      priority: "none",
    });
    setTitle("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 h-9 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm"
        />
        <button
          onClick={onAdd}
          className="h-9 px-3 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold"
        >
          +
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Nothing matches</div>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-auto">
          {visible.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2"
            >
              <div className="text-sm">{t.title}</div>
              <div className="text-xs text-gray-400">{t.calendarId || "main"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
