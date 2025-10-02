"use client";
import { LifehubDataProvider } from "@/lib/data-context";
export default function ConsoleCard({
  title,
  subtitle,
  height = 640,
  children,
  rightSlot, // e.g. buttons on header right
  dragHandleProps = {}, // spread onto the drag handle
}) {
  return (
    <section
      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <button
            className="cursor-grab active:cursor-grabbing grid place-items-center w-7 h-7 rounded-md border border-gray-200 bg-white text-gray-400"
            title="Drag to move"
            aria-label="Drag to move"
            {...dragHandleProps}
          >
            ⋮⋮
          </button>
          <div>
            <div className="text-base font-semibold text-gray-800">{title}</div>
            {subtitle ? (
              <div className="text-xs text-gray-500">{subtitle}</div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>

      {/* Body (scrollable) */}
      <div className="h-[calc(100%-52px)] overflow-auto px-4 py-3">
        {children}
      </div>
    </section>
  );
}
