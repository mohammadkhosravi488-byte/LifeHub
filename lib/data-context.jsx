"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "lifehub-demo-data";

function minutesFrom(date, minutes) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function daysFrom(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setHours(0, 0, 0, 0);
  return next;
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function createDefaultData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(daysFrom(now, 1));
  const nextWeekStart = startOfDay(daysFrom(now, 7));

  return {
    user: {
      id: "demo-student",
      name: "Alex Student",
      email: "alex@student.school",
    },
    calendars: [
      { id: "main", name: "Personal", color: "#6366F1" },
      { id: "school", name: "School", color: "#10B981" },
      { id: "work", name: "Work", color: "#F97316" },
      { id: "fitness", name: "Fitness", color: "#EC4899" },
    ],
    events: [
      {
        id: "evt-math",
        calendarId: "school",
        summary: "Mathematics",
        description: "Calculus revision before the mock exam.",
        location: "Room 204",
        start: iso(minutesFrom(todayStart, 9 * 60)),
        end: iso(minutesFrom(todayStart, 10 * 60)),
        allDay: false,
        source: "demo",
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: "evt-physics",
        calendarId: "school",
        summary: "Physics Lab",
        description: "Experiment write-up due afterwards.",
        location: "Science Wing",
        start: iso(minutesFrom(todayStart, 11 * 60)),
        end: iso(minutesFrom(todayStart, 12 * 60 + 30)),
        allDay: false,
        source: "demo",
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: "evt-soccer",
        calendarId: "fitness",
        summary: "Soccer Training",
        description: "Bring water bottle and shin pads.",
        location: "Oval 2",
        start: iso(minutesFrom(todayStart, 16 * 60)),
        end: iso(minutesFrom(todayStart, 17 * 60 + 30)),
        allDay: false,
        source: "demo",
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: "evt-essay",
        calendarId: "school",
        summary: "English Essay Due",
        description: "Submit via Sentral before midnight.",
        start: iso(tomorrowStart),
        end: iso(minutesFrom(tomorrowStart, 23 * 60 + 50)),
        allDay: true,
        source: "demo",
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: "evt-shift",
        calendarId: "work",
        summary: "Cafe Shift",
        location: "Local Bean Cafe",
        description: "Covering the afternoon shift.",
        start: iso(minutesFrom(daysFrom(todayStart, 2), 14 * 60)),
        end: iso(minutesFrom(daysFrom(todayStart, 2), 19 * 60)),
        allDay: false,
        source: "demo",
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: "evt-exam",
        calendarId: "school",
        summary: "Chemistry Exam",
        location: "Hall A",
        description: "Bring calculator and ID.",
        start: iso(minutesFrom(nextWeekStart, 9 * 60)),
        end: iso(minutesFrom(nextWeekStart, 10 * 60 + 30)),
        allDay: false,
        source: "demo",
        createdAt: iso(now),
        updatedAt: iso(now),
      },
    ],
    todos: [
      {
        id: "todo-chem",
        text: "Revise chemistry notes",
        done: false,
        calendarId: "school",
        createdAt: iso(now),
        updatedAt: iso(now),
        due: iso(daysFrom(todayStart, 1)),
      },
      {
        id: "todo-essay",
        text: "Draft English essay introduction",
        done: true,
        calendarId: "school",
        createdAt: iso(daysFrom(todayStart, -1)),
        updatedAt: iso(daysFrom(todayStart, -1)),
        due: iso(tomorrowStart),
      },
      {
        id: "todo-gym",
        text: "Book gym session with Sam",
        done: false,
        calendarId: "fitness",
        createdAt: iso(daysFrom(todayStart, -2)),
        updatedAt: iso(daysFrom(todayStart, -2)),
        due: null,
      },
    ],
  };
}

function readStoredData() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (err) {
    console.warn("Failed to read LifeHub demo data", err);
    return null;
  }
}

function writeStoredData(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to persist LifeHub demo data", err);
  }
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const LifehubDataContext = createContext(null);

export function LifehubDataProvider({ children }) {
  const [data, setData] = useState(() => createDefaultData());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readStoredData();
    if (stored) {
      setData((current) => ({
        ...current,
        ...stored,
        calendars: Array.isArray(stored.calendars) && stored.calendars.length
          ? stored.calendars
          : current.calendars,
        events: Array.isArray(stored.events) ? stored.events : current.events,
        todos: Array.isArray(stored.todos) ? stored.todos : current.todos,
      }));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredData(data);
  }, [data, hydrated]);

  const value = useMemo(() => {
    function toEventObject(raw) {
      return {
        ...raw,
        start: new Date(raw.start),
        end: raw.end ? new Date(raw.end) : null,
        createdAt: raw.createdAt ? new Date(raw.createdAt) : null,
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
      };
    }

    function toTodoObject(raw) {
      return {
        ...raw,
        createdAt: raw.createdAt ? new Date(raw.createdAt) : null,
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
        due: raw.due ? new Date(raw.due) : null,
      };
    }

    const addEvent = (input) => {
      const now = new Date();
      const id = createId("evt");
      const record = {
        id,
        calendarId: input.calendarId || "main",
        summary: input.summary?.trim() || "Untitled event",
        description: input.description?.trim() || "",
        location: input.location?.trim() || "",
        allDay: !!input.allDay,
        start: iso(input.start || now),
        end: input.end ? iso(input.end) : null,
        source: "manual",
        createdAt: iso(now),
        updatedAt: iso(now),
      };
      setData((prev) => ({ ...prev, events: [...prev.events, record] }));
      return id;
    };

    const updateEvent = (id, patch) => {
      setData((prev) => ({
        ...prev,
        events: prev.events.map((event) =>
          event.id === id
            ? {
                ...event,
                ...patch,
                start: patch.start ? iso(patch.start) : event.start,
                end: patch.end ? iso(patch.end) : event.end,
                updatedAt: iso(new Date()),
              }
            : event
        ),
      }));
    };

    const removeEvent = (id) => {
      setData((prev) => ({
        ...prev,
        events: prev.events.filter((event) => event.id !== id),
      }));
    };

    const addTodo = ({ text, calendarId = "main", due = null }) => {
      const trimmed = text.trim();
      if (!trimmed) return null;
      const now = new Date();
      const record = {
        id: createId("todo"),
        text: trimmed,
        done: false,
        calendarId,
        due: due ? iso(due) : null,
        createdAt: iso(now),
        updatedAt: iso(now),
      };
      setData((prev) => ({ ...prev, todos: [record, ...prev.todos] }));
      return record.id;
    };

    const toggleTodo = (id) => {
      setData((prev) => ({
        ...prev,
        todos: prev.todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                done: !todo.done,
                updatedAt: iso(new Date()),
              }
            : todo
        ),
      }));
    };

    const removeTodo = (id) => {
      setData((prev) => ({
        ...prev,
        todos: prev.todos.filter((todo) => todo.id !== id),
      }));
    };

    const addCalendar = ({ name, color }) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const record = {
        id: createId("cal"),
        name: trimmed,
        color: color || "#6366F1",
      };
      setData((prev) => ({ ...prev, calendars: [...prev.calendars, record] }));
      return record;
    };

    const updateCalendarColor = (id, color) => {
      setData((prev) => ({
        ...prev,
        calendars: prev.calendars.map((cal) =>
          cal.id === id ? { ...cal, color: color || cal.color } : cal
        ),
      }));
    };

    const resetData = () => {
      const defaults = createDefaultData();
      setData(defaults);
      writeStoredData(defaults);
    };

    return {
      hydrated,
      user: data.user,
      calendars: data.calendars,
      events: data.events.map(toEventObject),
      todos: data.todos.map(toTodoObject),
      addEvent,
      updateEvent,
      removeEvent,
      addTodo,
      toggleTodo,
      removeTodo,
      addCalendar,
      updateCalendarColor,
      resetData,
    };
  }, [data, hydrated]);

  return (
    <LifehubDataContext.Provider value={value}>
      {children}
    </LifehubDataContext.Provider>
  );
}

export function useLifehubData() {
  const context = useContext(LifehubDataContext);
  if (!context) {
    throw new Error("useLifehubData must be used within a LifehubDataProvider");
  }
  return context;
}
