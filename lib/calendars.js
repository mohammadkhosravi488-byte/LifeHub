// lib/calendars.js
import { db } from "@/lib/firebase";
import {
  collection, doc, setDoc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";

export const DEFAULT_CALENDARS = [
  { id: "personal", name: "Personal", color: "#4f46e5" },
  { id: "timetable", name: "Timetable", color: "#059669" },
  { id: "work", name: "Work", color: "#2563eb" },
  { id: "assessments", name: "Assessments", color: "#dc2626" },
];

// Ensure the 4 defaults exist for a user (safe to call on login)
export async function ensureDefaultCalendars(uid) {
  const col = collection(db, "users", uid, "calendars");
  await Promise.all(
    DEFAULT_CALENDARS.map((c) =>
      setDoc(
        doc(col, c.id),
        { name: c.name, color: c.color, createdAt: serverTimestamp() },
        { merge: true }
      )
    )
  );
}

// Live subscribe to calendars (ordered by name)
export function subscribeCalendars(uid, cb) {
  const q = query(collection(db, "users", uid, "calendars"), orderBy("name"));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    cb(list);
  });
}
