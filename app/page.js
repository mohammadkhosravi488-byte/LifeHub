"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

import AuthButtons from "@/components/AuthButtons";
import CalendarTabs from "@/components/CalendarTabs";
import CalendarDay from "@/components/CalendarDay";
import Upcoming from "@/components/Upcoming";
import TodoList from "@/components/TodoList";
import AIConsole from "@/components/AIConsole";

export default function Home() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // Tabs & filters
  const [calendarFilter, setCalendarFilter] = useState("main"); // "main" is default
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState([]); // UI list shown under Filters
  const [selectedCalendarIds, setSelectedCalendarIds] = useState([]); // multi-select

  // Keep “Main” always in the list
  const selectableCalendars = useMemo(() => {
    const uniq = new Map();
    uniq.set("main", { id: "main", name: "Main" });
    (availableCalendars || []).forEach((c) => {
      if (c?.id && c.id !== "main") uniq.set(c.id, { id: c.id, name: c.name || c.id });
    });
    return Array.from(uniq.values());
  }, [availableCalendars]);

  const toggleSelected = (id) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCalendarIds([]);
    setFiltersOpen(false);
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
          <CalendarTabs
            value={calendarFilter}
            onChange={setCalendarFilter}
            // Let CalendarDay tell us which calendars exist so filters show real chips
            onCalendarsDiscovered={setAvailableCalendars}
          />

          <div className="flex items-center gap-3">
            <Link
              href="/import"
              className="h-8 px-5 rounded-full border border-gray-300 bg-white text-sm font-semibold flex items-center"
              title="Import .ics"
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
            <div className="flex items-center justify-between">
              <div>
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
              <button
                onClick={clearFilters}
                className="h-8 px-3 rounded-md border border-gray-300 text-sm bg-white"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Center: Calendar + Upcoming */}
          <div className="lg:col-span-2 space-y-6">
            <CalendarDay
              calendarFilter={calendarFilter}
              selectedCalendarIds={selectedCalendarIds}
              onCalendarsDiscovered={setAvailableCalendars}
            />

            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Upcoming</h2>
              <Upcoming
                calendarFilter={calendarFilter}
                search={search}
                selectedCalendarIds={selectedCalendarIds}
              />
            </div>
          </div>

          {/* Right: AI + To-dos */}
          <div className="space-y-6">
            <AIConsole />
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
