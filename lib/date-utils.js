import { format } from "date-fns";

export function formatDay(date) {
  return format(date, "EEEE, MMMM d"); // Thursday, October 2
}

export function formatMonthYear(date) {
  return format(date, "MMMM yyyy"); // October 2025
}

export function formatTime(date) {
  return format(date, "h:mm a"); // 2:30 PM
}

export function formatShort(date) {
  return format(date, "EEE, MMM d"); // Thu, Oct 2
}

// 🎨 Accent palettes for calendars
const ACCENTS = [
  {
    base: "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-100",
    sub: "text-indigo-500 dark:text-indigo-200/80",
    dot: "bg-indigo-500",
  },
  {
    base: "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-100",
    sub: "text-emerald-500 dark:text-emerald-200/80",
    dot: "bg-emerald-500",
  },
  {
    base: "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-100",
    sub: "text-amber-600 dark:text-amber-200/80",
    dot: "bg-amber-500",
  },
  {
    base: "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-100",
    sub: "text-rose-500 dark:text-rose-200/80",
    dot: "bg-rose-500",
  },
  {
    base: "bg-sky-50 border-sky-100 text-sky-700 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-100",
    sub: "text-sky-500 dark:text-sky-200/80",
    dot: "bg-sky-500",
  },
];

// Hash calendarId to stable accent
export function getAccent(calendarId) {
  const safeId = calendarId || "main";
  let hash = 0;
  for (let i = 0; i < safeId.length; i++) {
    hash = (hash + safeId.charCodeAt(i)) % ACCENTS.length;
  }
  return ACCENTS[hash];
}
