"use client";

import { useState } from "react";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import TodoList from "@/components/TodoList";
import Upcoming from "@/components/Upcoming";
import AddEvent from "@/components/AddEvent";
import CalendarTabs from "@/components/CalendarTabs";
import CalendarMonth from "@/components/CalendarMonth";

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

export default function Home(){
  const [calendarFilter,setCalendarFilter]=useState("all");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-[var(--ink)]">
      <HeaderBar />

      <ControlStrip
        value={calendarFilter}
        onChange={setCalendarFilter}
        onAddCalendar={()=>alert("Add Calendar dialog (coming soon)")}
        onSearchOpen={()=>{}}
        onFilterOpen={()=>alert("Filters (coming soon)")}
      />

      <div className="max-w-[1600px] mx-auto px-6 mt-6 grid grid-cols-1 xl:grid-cols-[60px_1fr_560px] gap-6">
        <LeftRail />

        {/* Left column: Calendar + Todo */}
        <div className="flex flex-col gap-6">
          {/* Calendar card (Day view) */}
          <CalendarDay calendarFilter={calendarFilter} />

          {/* Month view below (for context) */}
          <section className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Calendar</h2>
            <CalendarMonth calendarFilter={calendarFilter} />
          </section>

          {/* To-do list card */}
          <section className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6">
            <h2 className="text-[22px] font-bold text-center mb-3">To do list</h2>
            <TodoList />
          </section>
        </div>

        {/* Right column: AI Console + Upcoming + AddEvent + Auth */}
        <div className="flex flex-col gap-6">
          <AIConsole />
          <section className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upcoming</h2>
            <Upcoming calendarFilter={calendarFilter}/>
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
}
