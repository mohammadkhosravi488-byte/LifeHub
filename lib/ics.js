"use client";
import * as ICAL from "ical.js";

export function parseIcs(text) {
  const jcalData = ICAL.parse(text);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent") || [];
  return vevents.map((v) => {
    const ev = new ICAL.Event(v);
    return {
      uid: v.getFirstPropertyValue("uid") || crypto.randomUUID(),
      summary: ev.summary || "(no title)",
      start: ev.startDate?.toJSDate() ?? null,
      end: ev.endDate?.toJSDate() ?? null,
      location: v.getFirstPropertyValue("location") || "",
      description: v.getFirstPropertyValue("description") || "",
    };
  });
}
