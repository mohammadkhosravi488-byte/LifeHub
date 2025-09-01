"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import AuthButtons from "@/components/AuthButtons";
import CalendarTabs from "@/components/CalendarTabs";
import Upcoming from "@/components/Upcoming";
import TodoList from "@/components/TodoList";

export default function Home() {
  // auth
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // calendars (Main + any user-created)
  const [calendars, setCalendars] = useState([]);
  useEffect(() => {
    if (!user) return setCalendars([]);
    const ref = collection(db, "users", user.uid, "calendars");
    // order by name so they render stable
    const qref = query(ref, orderBy("name", "asc"));
    const unsub = onSnapshot(qref, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCalendars(rows);
    });
    return () => unsub();
  }, [user]);

  // tabs
  const [calendarFilter, setCalendarFilter] = useState("main");

  // search & filter
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState([]); // multi-select filter

  // computed list of selectable calendars (never duplicates Main)
  const selectableCalendars = useMemo(() => {
    return [
      { id: "main", name: "Main" },
      ...calendars
        .filter((c) => c && c.id && c.id !== "main")
        .map((c) => ({ id: c.id, name: c.name || c.id })),
    ];
  }, [calendars]);

  const toggleSelected = (id) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-6">
          <h1 className="text-4xl font-bold text-indigo-700 tracking-tight text-center flex-1">
            Welcome to LifeHub
          </h1>
          <div className="flex justify-end w-60">
            <AuthButtons />
          </div>
        </div>

        {/* Control strip */}
        <div className="mt-6 flex items-center justify-between">
          {/* Tabs */}
          <CalendarTabs
            value={calendarFilter}
            onChange={setCalendarFilter}
            calendars={calendars} // only shows Main by default; user-created appear as you add them
          />

          {/* Right controls: Import + Search + Filter */}
          <div className="flex items-center gap-3">
            <Link
              href="/import"
              className="h-8 px-5 rounded-full border border-gray-300 bg-white text-sm font-semibold flex items-center"
              title="Import .ics to Main (or selected calendar when editor is ready)"
            >
              Import
            </Link>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-80 h-8 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Search"
            />

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              className="h-8 w-8 rounded-lg border border-gray-300 bg-white text-sm"
              title="Filters"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div
            id="filters-panel"
            className="mt-3 p-3 bg-white border border-gray-200 rounded-xl"
          >
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Calendars
            </div>
            <div className="flex flex-wrap gap-2">
              {selectableCalendars.map((c) => {
                const active = selectedCalendarIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleSelected(c.id)}
                    className={[
                      "px-3 h-8 rounded-full border text-sm",
                      active
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-gray-300 bg-white",
                    ].join(" ")}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / center: calendar + upcoming */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar canvas placeholder (month/day view can replace this) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 min-h-[420px]">
              <div className="text-lg font-semibold text-gray-800 mb-2">
                Calendar — {calendarFilter === "main" ? "Main" : calendarFilter}
              </div>
              <p className="text-gray-600 text-sm">
                (Visual day/week/month canvas goes here. For now, use the
                “Upcoming” list below; it’s filtered by your tab + filters.)
              </p>
            </div>

            {/* Upcoming */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Upcoming
              </h2>
              <Upcoming
                calendarFilter={calendarFilter}
                search={search}
                selectedCalendarIds={selectedCalendarIds}
              />
            </div>
          </div>

          {/* Right: To-dos */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Your To-Dos
              </h2>
              <TodoList
                calendarFilter={calendarFilter}
                search={search}
                selectedCalendarIds={selectedCalendarIds}
              />
            </div>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </main>
  );
}
