"use client";

import { useEffect, useMemo, useState } from "react";
import { useLifehubData } from "@/lib/data-context";

export default function FilterSheet({ open, onClose }) {
  const { calendars } = useLifehubData();
  const [selected, setSelected] = useState(new Set());
  const [busyOnly, setBusyOnly] = useState(false);

  const options = useMemo(() => {
    const base = [{ id: "main", name: "Personal" }];
    const unique = new Map(base.concat(calendars).map((cal) => [cal.id, cal]));
    return Array.from(unique.values());
  }, [calendars]);

  useEffect(() => {
    if (!open) return;
    const detail = { calendars: Array.from(selected), busyOnly };
    window.dispatchEvent(new CustomEvent("lifehub:filters", { detail }));
  }, [open, selected, busyOnly]);

  if (!open) return null;

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-end">
      <div className="w-[340px] bg-white dark:bg-neutral-900 h-full p-4 border-l border-gray-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
          <button onClick={onClose} className="px-2 py-1 border rounded text-sm">
            Close
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Calendars</div>
            {options.map((cal) => (
              <label key={cal.id} className="flex items-center gap-2 py-1 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={selected.has(cal.id)}
                  onChange={() => toggle(cal.id)}
                />
                <span>{cal.name}</span>
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={busyOnly}
              onChange={(e) => setBusyOnly(e.target.checked)}
            />
            Only show busy days
          </label>
        </div>
      </div>
    </div>
  );
}
