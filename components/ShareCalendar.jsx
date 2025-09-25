"use client";

import { useMemo } from "react";
import { useLifehubData } from "@/lib/data-context";

export default function ShareCalendar({ calendarId }) {
  const { calendars } = useLifehubData();
  const calendar = useMemo(
    () => calendars.find((cal) => cal.id === calendarId) || calendars[0],
    [calendars, calendarId]
  );

  if (!calendar) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Share {calendar.name}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        This demo keeps sharing local to your browser. Invite family or classmates by telling them about LifeHub and syncing
        the same calendars in their account.
      </p>
      <ol className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200 list-decimal list-inside">
        <li>Open LifeHub on their device.</li>
        <li>Select the “{calendar.name}” calendar from the tabs.</li>
        <li>Import this calendar’s ICS feed or manually recreate key events.</li>
      </ol>
    </div>
  );
}
