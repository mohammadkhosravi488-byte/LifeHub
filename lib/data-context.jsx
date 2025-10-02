"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

/* ----------------------- helpers ----------------------- */

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate(); // Firestore Timestamp
  return new Date(value);
}

function toTimestamp(value) {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  return Timestamp.fromDate(new Date(value));
}

function coerceString(x, fallback = "") {
  if (typeof x === "string") return x.trim();
  return fallback;
}

const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;

/* Calendar model:
{
  id,
  name: string,
  color: string,             // hex or token
  ownerId: string,           // uid
  ownerEmail: string,
  members: [ { email, role } ],
  createdAt, updatedAt
}
*/

/* Event model:
{
  id,
  calendarId: string,
  summary: string,
  description?: string,
  start: Timestamp | Date,
  end?: Timestamp | Date,
  allDay?: boolean,
  location?: string,
  createdAt, updatedAt, ownerId
}
*/

/* Todo model:
{
  id,
  calendarId: string,
  text: string,
  done: boolean,
  due?: Timestamp | Date,
  createdAt, updatedAt, ownerId
}
*/

const DataCtx = createContext(null);

export function LifehubDataProvider({ children }) {
  const [user, setUser] = useState(null);

  // main lists exposed to UI
  const [calendars, setCalendars] = useState([]);  // joined: owned + shared
  const [events, setEvents] = useState([]);        // next 90 days window (multi-cal)
  const [todos, setTodos] = useState([]);          // all todos (multi-cal)

  // local
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // computed
  const calendarIds = useMemo(() => calendars.map(c => c.id), [calendars]);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  // realtime: calendars (owned or where user is a member by email)
  useEffect(() => {
    if (!user) {
      setCalendars([]);
      return;
    }

    const ownedQ = query(
      collection(db, "calendars"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const sharedQ = query(
      collection(db, "calendars"),
      where("membersEmails", "array-contains", user.email || "___none___"),
      orderBy("createdAt", "desc")
    );

    let ownedSnapUnsub = () => {};
    let sharedSnapUnsub = () => {};

    ownedSnapUnsub = onSnapshot(ownedQ, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        list.push({
          id: d.id,
          name: coerceString(data.name, "Calendar"),
          color: coerceString(data.color, "#4f46e5"),
          ownerId: data.ownerId,
          ownerEmail: data.ownerEmail || "",
          members: data.members || [],                 // [{email,role}]
          membersEmails: data.membersEmails || [],     // [email]
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setCalendars(prev => {
        const others = (prev || []).filter(c => c.__kind !== "owned");
        return [
          ...list.map(c => ({ ...c, __kind: "owned" })),
          ...others.filter(x => !list.some(y => y.id === x.id)),
        ];
      });
    }, setErr);

    sharedSnapUnsub = onSnapshot(sharedQ, (snap) => {
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        list.push({
          id: d.id,
          name: coerceString(data.name, "Calendar"),
          color: coerceString(data.color, "#22c55e"),
          ownerId: data.ownerId,
          ownerEmail: data.ownerEmail || "",
          members: data.members || [],
          membersEmails: data.membersEmails || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setCalendars(prev => {
        const owned = (prev || []).filter(c => c.__kind === "owned");
        const merged = [
          ...owned,
          ...list
            .filter(c => !owned.some(o => o.id === c.id))
            .map(c => ({ ...c, __kind: "shared" })),
        ];
        return merged;
      });
    }, setErr);

    return () => {
      ownedSnapUnsub();
      sharedSnapUnsub();
    };
  }, [user]);

  // realtime: events (limit window to reduce reads)
  useEffect(() => {
    if (!user || calendarIds.length === 0) {
      setEvents([]);
      return;
    }
    // We can’t use `in` with too many ids; for now, split into batches of 10
    const ids = [...calendarIds];
    const batches = [];
    while (ids.length) batches.push(ids.splice(0, 10));

    const unsubs = [];
    const now = new Date();
    const start = Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000)); // since yesterday
    const end = Timestamp.fromDate(new Date(now.getTime() + DAYS_90_MS)); // +90 days

    batches.forEach((batch) => {
      const qEv = query(
        collection(db, "events"),
        where("calendarId", "in", batch),
        where("start", ">=", start),
        where("start", "<=", end),
        orderBy("start", "asc"),
        limit(500)
      );
      const unsub = onSnapshot(qEv, (snap) => {
        setEvents((prev) => {
          // merge this batch
          const rest = prev.filter((e) => !batch.includes(e.calendarId));
          const incoming = [];
          snap.forEach((d) => {
            const data = d.data() || {};
            incoming.push({
              id: d.id,
              calendarId: data.calendarId,
              summary: coerceString(data.summary, "(no title)"),
              description: coerceString(data.description),
              start: toDate(data.start),
              end: toDate(data.end),
              allDay: !!data.allDay,
              location: coerceString(data.location),
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              ownerId: data.ownerId,
            });
          });
          const merged = [...rest, ...incoming];
          // sort
          merged.sort((a, b) => {
            const aT = (a.start?.getTime?.() || 0);
            const bT = (b.start?.getTime?.() || 0);
            return aT - bT;
          });
          return merged;
        });
      }, setErr);
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((fn) => fn());
  }, [user, calendarIds.join("|")]);

  // realtime: todos
  useEffect(() => {
    if (!user || calendarIds.length === 0) {
      setTodos([]);
      return;
    }
    const ids = [...calendarIds];
    const batches = [];
    while (ids.length) batches.push(ids.splice(0, 10));

    const unsubs = [];
    batches.forEach((batch) => {
      const qTd = query(
        collection(db, "todos"),
        where("calendarId", "in", batch),
        orderBy("createdAt", "desc"),
        limit(1000)
      );
      const unsub = onSnapshot(qTd, (snap) => {
        setTodos((prev) => {
          const rest = prev.filter((t) => !batch.includes(t.calendarId));
          const incoming = [];
          snap.forEach((d) => {
            const data = d.data() || {};
            incoming.push({
              id: d.id,
              calendarId: data.calendarId,
              text: coerceString(data.text, "(untitled task)"),
              done: !!data.done,
              due: toDate(data.due),
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              ownerId: data.ownerId,
            });
          });
          const merged = [...rest, ...incoming];
          return merged;
        });
      }, setErr);
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((fn) => fn());
  }, [user, calendarIds.join("|")]);

  useEffect(() => {
    setLoading(!user); // simplistic: loading until we have a user
  }, [user]);

  /* ----------------------- calendar actions ----------------------- */

  const addCalendar = useCallback(async ({ name, color = "#4f46e5", inviteEmails = [] }) => {
    if (!user) throw new Error("Not signed in");
    const ref = await addDoc(collection(db, "calendars"), {
      name: coerceString(name, "Calendar"),
      color,
      ownerId: user.uid,
      ownerEmail: user.email || "",
      members: [],                 // future: [{email,role}]
      membersEmails: inviteEmails.filter(Boolean),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }, [user]);

  const shareCalendar = useCallback(async (calendarId, { emails = [], role = "writer" }) => {
    // store lightweight lists; full ACL UI can come later
    const ref = doc(db, "calendars", calendarId);
    await updateDoc(ref, {
      membersEmails: arrayUnion(...emails),
      updatedAt: serverTimestamp(),
    });
    // (optional) add richer member objects in `members`
  }, []);

  /* ----------------------- event actions ----------------------- */

  const addEvent = useCallback(async ({
    calendarId,
    summary,
    description = "",
    start,
    end = null,
    allDay = false,
    location = "",
  }) => {
    if (!user) throw new Error("Not signed in");
    if (!calendarId) throw new Error("calendarId is required");
    const ref = await addDoc(collection(db, "events"), {
      calendarId,
      summary: coerceString(summary, "(no title)"),
      description: coerceString(description, ""),
      start: toTimestamp(start || new Date()),
      end: end ? toTimestamp(end) : null,
      allDay: !!allDay,
      location: coerceString(location, ""),
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }, [user]);

  const updateEvent = useCallback(async (id, patch) => {
    const ref = doc(db, "events", id);
    const clean = { ...patch };
    if (clean.start) clean.start = toTimestamp(clean.start);
    if (clean.end) clean.end = toTimestamp(clean.end);
    await updateDoc(ref, { ...clean, updatedAt: serverTimestamp() });
  }, []);

  const removeEvent = useCallback(async (id) => {
    await deleteDoc(doc(db, "events", id));
  }, []);

  /* ----------------------- todo actions ----------------------- */

  const addTodo = useCallback(async ({ text, calendarId = "main", due = null }) => {
    if (!user) throw new Error("Not signed in");
    const ref = await addDoc(collection(db, "todos"), {
      text: coerceString(text, "(untitled task)"),
      calendarId,
      done: false,
      due: due ? toTimestamp(due) : null,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }, [user]);

  const toggleTodo = useCallback(async (id) => {
    const tRef = doc(db, "todos", id);
    // naive: fetch once to flip (optimize later if needed)
    const snap = await getDocs(query(collection(db, "todos"), where("__name__", "==", id), limit(1)));
    let current = false;
    snap.forEach((d) => { current = !!d.data()?.done; });
    await updateDoc(tRef, { done: !current, updatedAt: serverTimestamp() });
  }, []);

  const removeTodo = useCallback(async (id) => {
    await deleteDoc(doc(db, "todos", id));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error: err,

    calendars,
    events,
    todos,

    // expose helpers where needed
    toDate,

    // actions
    addCalendar,
    shareCalendar,

    addEvent,
    updateEvent,
    removeEvent,

    addTodo,
    toggleTodo,
    removeTodo,
  }), [
    user, loading, err,
    calendars, events, todos,
    addCalendar, shareCalendar,
    addEvent, updateEvent, removeEvent,
    addTodo, toggleTodo, removeTodo,
  ]);

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useLifehubData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error("useLifehubData must be used within LifehubDataProvider");
  return ctx;
}
