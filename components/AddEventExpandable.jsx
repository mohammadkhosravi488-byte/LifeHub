"use client";

import { useState } from "react";
import AddEvent from "@/components/AddEvent";

export default function AddEventExpandable({
  defaultCalendarId = "main",
  defaultDate = new Date(),
  onCreated = () => {},
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add Event
        </button>
      ) : (
        <div className="absolute right-0 z-50 mt-2 w-[420px]">
          <AddEvent
            defaultCalendarId={defaultCalendarId}
            defaultDate={defaultDate}
            onClose={() => setOpen(false)}
            onCreated={() => {
              setOpen(false);
              onCreated();
            }}
          />
        </div>
      )}
    </div>
  );
}
