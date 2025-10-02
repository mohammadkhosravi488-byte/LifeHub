import { format } from "date-fns";

// Always deterministic everywhere
export function formatDay(date) {
  return format(date, "EEEE, MMMM d"); // e.g., Thursday, October 2
}

export function formatMonthYear(date) {
  return format(date, "MMMM yyyy"); // e.g., October 2025
}

export function formatTime(date) {
  return format(date, "h:mm a"); // e.g., 2:30 PM
}

export function formatShort(date) {
  return format(date, "EEE, MMM d"); // e.g., Thu, Oct 2
}
