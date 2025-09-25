"use client";

import DarkModeToggle from "@/components/DarkModeToggle";
import { useLifehubData } from "@/lib/data-context";

export default function AuthButtons() {
  const { user, resetData } = useLifehubData();

  return (
    <div className="flex items-center gap-3">
      <DarkModeToggle />
      <div className="hidden text-right text-sm text-gray-600 dark:text-gray-300 sm:block">
        <div className="font-medium text-gray-800 dark:text-gray-100">
          {user?.name || "Guest"}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {user?.email || "Demo mode"}
        </div>
      </div>
      <button
        type="button"
        onClick={resetData}
        className="px-4 py-1 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold"
      >
        Reset demo
      </button>
    </div>
  );
}
