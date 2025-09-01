"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import AuthButtons from "@/components/AuthButtons";
import CalendarTabs from "@/components/CalendarTabs";

// If these components exist in your repo, keep the imports.
// If not, comment them out until they’re added back to avoid build errors.
import Upcoming from "@/components/Upcoming";
import TodoList from "@/components/TodoList";
// import CalendarDay from "@/components/CalendarDay";
// import CalendarMonth from "@/components/CalendarMonth";
// import AIConsole from "@/components/AIConsole";

export default function Home() {
  // Which calendar is selected (tabs)
  const [calendarFilter, setCalendarFilter] = useState("main");

  // Search + filter (UI only for now—safe no-ops)
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // NOTE: start with only Main visible; add more later when you actually create them
  const availableCalendars = useMemo(
    () => [
      // example later: { id: "family", name: "Family" },
      // example later: { id: "study", name: "Study" },
      // example later: { id: "assessments", name: "Assessments" },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Page wrapper */}
      <div className="max-w-6xl mx-auto px-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between pt-6">
          <h1 className="text-4xl font-bold text-indigo-700 tracking-tight text-center flex-1">
            Welcome to LifeHub
          </h1>
          <div className="flex justify-end w-60">
            <AuthButtons />
          </div>
        </div>

        {/* Control Strip */}
        <div className="mt-6 flex items-center justify-between">
          {/* Left: Tabs */}
          <CalendarTabs
            value={calendarFilter}
            onChange={setCalendarFilter}
            calendars={availableCalendars}
          />

          {/* Right: Add + Search + Filter */}
          <div className="flex items-center gap-3">
            {/* Add (opens create calendar later; for now link to /import and /add-event stubs) */}
            <Link
              href="/import"
              className="h-8 px-5 rounded-full border border-gray-300 bg-white text-sm font-semibold flex items-center"
            >
              Import
            </Link>

            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-80 h-8 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Search"
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              className="h-8 w-8 rounded-lg border border-gray-300 bg-white text-sm"
              title="Filters"
            >
              ⏷
            </button>
          </div>
        </div>

        {/* Filters panel (placeholder; harmless if unopened) */}
        {filtersOpen && (
          <div
            id="filters-panel"
            className="mt-3 p-3 bg-white border border-gray-200 rounded-xl"
          >
            <div className="text-sm text-gray-600">
              Filters coming soon (calendar multi-select, priority, tags, assignees, time
              window, status, “only my items”).
            </div>
          </div>
        )}

        {/* Main Columns */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar / Upcoming column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar card placeholder (swap in CalendarDay/Month later) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 min-h-[420px]">
              <div className="text-lg font-semibold text-gray-800 mb-2">
                Calendar — {calendarFilter === "main" ? "Main" : calendarFilter}
              </div>
              <div className="text-gray-600 text-sm">
                Calendar canvas goes here (day/week/month views). Drag & drop, outlines for
                priority, etc. For now, use the Upcoming list below.
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Upcoming</h2>
              <Upcoming calendarFilter={calendarFilter} search={search} />
            </div>

            {/* Add Event */}
            {/* If you already have a component for this, render it here.
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Event</h2>
                  <AddEvent calendarId={calendarFilter} />
                </div>
            */}
          </div>

          {/* Right column: To-dos (and later AI Console) */}
          <div className="space-y-6">
            {/* AI Console placeholder */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h2 className="text-xl font-semibold text-indigo-700 text-center">AI Console</h2>
              <p className="text-sm text-gray-600 mt-2">
                Rearrange / Summary / Priority list will appear here. We’ll wire it after
                filters & search are in.
              </p>
            </div>

            {/* To-do list */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your To-Dos</h2>
              <TodoList calendarFilter={calendarFilter} search={search} />
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-10" />
      </div>
    </main>
  );
}
