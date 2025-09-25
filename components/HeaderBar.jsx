"use client";
import Link from "next/link";
import { useLifehubData } from "@/lib/data-context";

export default function HeaderBar() {
  const { user } = useLifehubData();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "LH";

  return (
    <header className="max-w-[1600px] mx-auto px-6 pt-6">
      <div className="flex items-center justify-center relative">
        <h1 className="text-[44px] font-bold text-center text-gray-900 dark:text-gray-100">
          Welcome to LifeHub
        </h1>
        <Link
          href="/settings"
          className="absolute right-0 flex items-center gap-2 group"
          aria-label="Open settings"
        >
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {`Hello ${user?.name?.split(" ")[0] || "there"}`}
          </span>
          <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 dark:border-neutral-700 bg-indigo-500/10 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-200">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  );
}
