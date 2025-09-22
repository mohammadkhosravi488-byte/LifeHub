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
import CalendarMonth from "@/components/CalendarMonth";
import CalendarYear from "@/components/CalendarYear";
import ViewToggle from "@/components/ViewToggle";
import ConsoleBoard from "@/components/ConsoleBoard";
import ConsoleCard from "@/components/ConsoleCard";
import CreateCalendarModal from "@/components/CreateCalendarModal";

const DEFAULT_ORDER = ["calendar", "upcoming", "ai", "todos"];

export default function Home() {
  // Hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  // View mode
  const [viewMode, setViewMode] = useState("day"); // "day" | "month" | "year"
  const cycleView = () =>
    setViewMode((m) => (m === "day" ? "month" : m === "month" ? "year" : "day"));

  // Filters / search
  const [calendarFilter, setCalendarFilter] = useState("main"); // "main" default
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState([]);

  // Create calendar modal
  const [createOpen, setCreateOpen] = useState(false);

  // Board order
  const [order, setOrder] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_ORDER;
    try {
      const saved = JSON.parse(localStorage.getItem("lh_board_order"));
      return Array.isArray(saved) && saved.length ? saved : DEFAULT_ORDER;
    } catch {
      return DEFAULT_ORDER;
    }
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lh_board_order", JSON.stringify(order));
    }
  }, [order]);

  // Build selectable calendars (always include Main)
  const selectableCalendars = useMemo(() => {
    const uniq = new Map();
    uniq.set("main", { id: "main", name: "Main" });
    (availableCalendars || []).forEach((c) => {
      if (c?.id && c.id !== "main")
        uniq.set(c.id, { id: c.id, name: c.name || c.id });
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

  // Build board items
  const items = useMemo(() => {
    const chosen = selectedCalendarIds.length ? selectedCalendarIds : ["main"];
    const cards = {
      calendar: {
        id: "calendar",
        spanLg: 2,
        height: 720,
        render: ({ dragHandleProps }) => (
          <ConsoleCard
            title="Calendar"
            subtitle={
              viewMode === "day"
                ? "Day view"
                : viewMode === "month"
                ? "Month view"
                : "Year view"
            }
            height={720}
            dragHandleProps={dragHandleProps}
            rightSlot={
              <ViewToggle mode={viewMode} onChange={setViewMode} onCycle={cycleView} />
            }
          >
            {viewMode === "day" && (
              <div className="min-h-[640px]">
                <CalendarDay
                  calendarFilter={calendarFilter}
                  selectedCalendarIds={chosen}
                  onCalendarsDiscovered={setAvailableCalendars}
                />
              </div>
            )}
            {viewMode === "month" && (
              <div className="min-h-[640px]">
                <CalendarMonth
                  calendarFilter={calendarFilter}
                  selectedCalendarIds={chosen}
                  onCalendarsDiscovered={setAvailableCalendars}
                />
              </div>
            )}
            {viewMode === "year" && (
              <div className="min-h-[640px]">
                <CalendarYear
                  calendarFilter={calendarFilter}
                  selectedCalendarIds={chosen}
                  onCalendarsDiscovered={setAvailableCalendars}
                />
              </div>
            )}
          </ConsoleCard>
        ),
      },
      upcoming: {
        id: "upcoming",
        spanLg: 2,
        height: 340,
        render: ({ dragHandleProps }) => (
          <ConsoleCard title="Upcoming" height={340} dragHandleProps={dragHandleProps}>
            <Upcoming
              calendarFilter={calendarFilter}
              search={search}
              selectedCalendarIds={chosen}
            />
          </ConsoleCard>
        ),
      },
      ai: {
        id: "ai",
        spanLg: 1,
        height: 780,
        render: ({ dragHandleProps }) => (
          <ConsoleCard title="AI Console" height={780} dragHandleProps={dragHandleProps}>
            <AIConsole />
          </ConsoleCard>
        ),
      },
      todos: {
        id: "todos",
        spanLg: 1,
        height: 360,
        render: ({ dragHandleProps }) => (
          <ConsoleCard title="Your To-Dos" height={360} dragHandleProps={dragHandleProps}>
            <TodoList
              calendarFilter={calendarFilter}
              search={search}
              selectedCalendarIds={chosen}
            />
          </ConsoleCard>
        ),
      },
    };

    const valid = order.filter((id) => cards[id]);
    return (valid.length ? valid : DEFAULT_ORDER).map((id) => cards[id]);
  }, [order, viewMode, calendarFilter, selectedCalendarIds, search, availableCalendars]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header (keep simple to avoid hydration mismatches) */}
        <div className="flex items-center justify-between pt-6">
          <h1 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-300">
            Welcome to LifeHub
          </h1>
          <div className="w-60 flex justify-end">
            <AuthButtons />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarTabs
                value={calendarFilter}
                onChange={setCalendarFilter}
                onCalendarsDiscovered={setAvailableCalendars}
              />

              <button
                onClick={() => setCreateOpen(true)}
                className="h-8 px-4 rounded-[12px] border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold"
              >
                Add calendar
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/import"
                className="h-8 px-5 rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold flex items-center"
              >
                Import
              </Link>
              <Link
                href="/settings"
                className="h-8 px-5 rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold flex items-center"
              >
                Settings
              </Link>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-80 h-8 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Search"
              />
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
                className="h-8 w-8 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                title="Filters"
              >
                <span className="sr-only">Filters</span>⚙️
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div
              id="filters-panel"
              className="p-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
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
                              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-500"
                              : "border-gray-300 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-200",
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
                  className="h-8 px-3 rounded-md border border-gray-300 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-800"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Board */}
        <div className="mt-6">
          <ConsoleBoard items={items} onReorder={(ids) => setOrder(ids)} />
        </div>

        {/* Modal */}
        <CreateCalendarModal
          open={createOpen}
          onClose={(result) => {
            setCreateOpen(false);
            if (result?.created && result.calendar) {
              setAvailableCalendars((prev) => [...prev, result.calendar]);
            }
          }}
          user={user}
        />

        <div className="h-10" />
      </div>
    </main>
  );
}
