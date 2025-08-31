"use client";
import { useState } from "react";

function SegTab({label,active,onClick}){
  return (
    <button
      onClick={onClick}
      className={`h-8 px-4 rounded-[12px] border text-sm font-semibold
        ${active ? "bg-white border-gray-300 text-gray-900" : "bg-white border-gray-300 text-gray-500"}
      `}
    >
      {label}
    </button>
  );
}

export default function ControlStrip({value,onChange,onAddCalendar,onSearchOpen,onFilterOpen}){
  const tabs = [
    {id:"all", label:"Main"},
    {id:"family", label:"Family"},
    {id:"timetable", label:"Study"},
    {id:"assessments", label:"Assessments"},
  ];
  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto px-6 mt-6 h-14 flex items-center justify-between border-b border-gray-200">
        {/* Left cluster */}
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-semibold text-[var(--ink-muted)] pr-3">Select Calendar:</span>
          <div className="flex items-center gap-2">
            {tabs.map(t=>(
              <SegTab key={t.id} label={t.label} active={value===t.id} onClick={()=>onChange(t.id)} />
            ))}
          </div>
        </div>
        {/* Right cluster */}
        <div className="flex items-center">
          <button
            onClick={onAddCalendar}
            className="h-8 w-[72px] rounded-[16px] border border-[var(--outline-neutral)] bg-white text-sm font-semibold shadow-[0_0_0_0_rgba(0,0,0,0)]
                       hover:shadow-sm"
          >
            Add
          </button>
          <div className="mx-4 relative">
            <input
              type="text"
              placeholder="Search…"
              onFocus={onSearchOpen}
              className="w-[320px] h-8 pl-8 pr-3 rounded-[12px] border border-[var(--outline-neutral)] text-sm
                         placeholder:text-[var(--ink-muted)]"
            />
            <span className="absolute left-2 top-1.5 select-none">🔍</span>
          </div>
          <button
            aria-label="Open filters"
            onClick={onFilterOpen}
            className="h-8 w-8 rounded-[8px] border border-[var(--outline-neutral)] bg-white text-lg"
            title="Filter"
          >
            ⏳
          </button>
        </div>
      </div>
    </div>
  );
}
