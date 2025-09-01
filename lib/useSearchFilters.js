// lib/useSearchFilters.js
"use client";
import { useEffect, useState } from "react";

/**
 * Subscribes to global search + filters events and returns
 * a `filterItems(items)` function you can apply to your arrays.
 *
 * Each item should have: title, notes, calendarId, status ("busy"|"free")
 */
export default function useSearchFilters() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ calendars: [], busyOnly: false });

  useEffect(() => {
    const onSearch = (e) => setSearchTerm((e.detail || "").toLowerCase());
    window.addEventListener("lifehub:search", onSearch);
    return () => window.removeEventListener("lifehub:search", onSearch);
  }, []);

  useEffect(() => {
    const onFilters = (e) => setFilters(e.detail || { calendars: [], busyOnly: false });
    window.addEventListener("lifehub:filters", onFilters);
    return () => window.removeEventListener("lifehub:filters", onFilters);
  }, []);

  function filterItems(items = []) {
    return items.filter((it) => {
      const text = `${it.title || ""} ${it.notes || ""}`.toLowerCase();
      const searchOk = !searchTerm || text.includes(searchTerm);

      const inSelectedCalendars =
        !filters.calendars?.length ||
        filters.calendars.includes(it.calendarId || "main");

      const busyOk = !filters.busyOnly || it.status === "busy";

      return searchOk && inSelectedCalendars && busyOk;
    });
  }

  return { filterItems, searchTerm, filters };
}
