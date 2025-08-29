"use client";
import ICAL from "ical.js";  // ✅ default import

// Safe ID fallback
function safeId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
  return "evt-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function parseIcs(text) {
  if (!text || typeof text !== "string") return [];

  let jcalData;
  try {
    jcalData = ICAL.parse(text);            // ✅ ICAL.parse
  } catch (e) {
    console.error("ICAL.parse failed", e);
    return [];
  }

  const comp = new ICAL.Component(jcalData); // ✅ ICAL.Component
  const vevents = comp.getAllSubcomponents("vevent") || [];

  const events = [];
  for (const v of vevents) {
    try {
      const ev = new ICAL.Event(v);         // ✅ ICAL.Event
      const startDate = ev.startDate ? ev.startDate.toJSDate() : null;
      const endDate   = ev.endDate ? ev.endDate.toJSDate() : null;
      if (!startDate || !endDate) continue;

      events.push({
        uid: v.getFirstPropertyValue("uid") || safeId(),
        summary: (ev.summary || "").trim() || "(no title)",
        start: startDate,
        end: endDate,
        location: (v.getFirstPropertyValue("location") || "").trim(),
        description: (v.getFirstPropertyValue("description") || "").trim(),
      });
    } catch (e) {
      console.warn("Skipping malformed VEVENT", e);
    }
  }
  return events;
}
