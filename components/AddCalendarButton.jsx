"use client";
import { LifehubDataProvider } from "@/lib/data-context";
export default function AddCalendarButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 px-4 rounded-[16px] border border-[var(--outline-neutral)] bg-white text-sm font-semibold"
      title="Create a new calendar"
    >
      Add
    </button>
  );
}
