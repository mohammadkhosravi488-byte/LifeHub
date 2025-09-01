"use client";

import HeaderBar from "@/components/HeaderBar";
import ControlStrip from "@/components/ControlStrip";
import LeftRail from "@/components/LeftRail";
import CalendarDay from "@/components/CalendarDay";
import CalendarMonth from "@/components/CalendarMonth";
import Upcoming from "@/components/Upcoming";
import AddEvent from "@/components/AddEvent";
import TodoList from "@/components/TodoList";
import AuthButtons from "@/components/AuthButtons";
import AIConsole from "@/components/AIConsole";
import { useState } from "react";
import FilterSheet from "@/components/FilterSheet";

export default function Home() {
  const [calendarFilter, setCalendarFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);


  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-[var(--ink)]">
      <HeaderBar />

      <ControlStrip
        value={calendarFilter}
        onChange={setCalendarFilter}
        onAddCalendar={() => setAddOpen(true)}
        onSearchOpen={() => {}}
        onFilterOpen={() => setFiltersOpen(true)}
      />

      <div className="max-w-[1600px] mx-auto px-6 mt-6 grid grid-cols-1 xl:grid-cols-[60px_1fr_560px] gap-6">
        <LeftRail />

        {/* Left column */}
        <div className="flex flex-col gap-6">
          <CalendarDay calendarFilter={calendarFilter} />

          <section className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Calendar</h2>
            <CalendarMonth calendarFilter={calendarFilter} />
          </section>

          <section className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6">
            <h2 className="text-[22px] font-bold text-center mb-3">To do list</h2>
            <TodoList />
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <AIConsole />
          <section className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upcoming</h2>
            <Upcoming calendarFilter={calendarFilter} />
          </section>
          <section className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Add Event</h2>
            <AddEvent />
          </section>
          <div className="bg-white/60 rounded-[16px] p-4 border border-[var(--outline-neutral)]">
            <AuthButtons />
          </div>
        </div>
      </div>

      <div className="h-8" />
    </main>
  );
  
<FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} />
}
