import { NextResponse } from "next/server";

// Helper: minutes since midnight
const mins = (d) => d.getHours() * 60 + d.getMinutes();

export async function POST(req) {
  try {
    const { events, targetEvent, workHours = { start: 8, end: 18 } } = await req.json();
    // events: [{startISO, endISO, summary}], targetEvent: {durationMins, earliestISO, latestISO}

    // 1) Build "busy" blocks from events
    const busy = events
      .map(e => ({
        start: new Date(e.startISO),
        end: new Date(e.endISO),
      }))
      .filter(e => e.start < e.end)
      .sort((a,b) => a.start - b.start);

    // 2) Simple greedy search for first free slot inside window & work hours
    const earliest = new Date(targetEvent.earliestISO);
    const latest   = new Date(targetEvent.latestISO);
    const dur = targetEvent.durationMins;

    // step through in 15-minute increments
    for (let t = new Date(earliest); t <= latest; t = new Date(t.getTime() + 15*60*1000)) {
      // enforce work hours (e.g. 08:00–18:00)
      if (t.getHours() < workHours.start || t.getHours() >= workHours.end) continue;

      const end = new Date(t.getTime() + dur*60*1000);
      if (end > latest) break;

      // check clash
      const clash = busy.some(b => !(end <= b.start || t >= b.end));
      if (!clash) {
        return NextResponse.json({
          ok: true,
          proposal: {
            startISO: t.toISOString(),
            endISO: end.toISOString(),
            reason: "First available slot within work hours without clashes.",
          },
        });
      }
    }

    // 3) If no exact free slot, ask the AI for a “best effort” suggestion
    // (You can uncomment below when you add your model/API key)
    /*
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const prompt = `Find a good reschedule time for a ${dur}min event inside ${targetEvent.earliestISO}..${targetEvent.latestISO},
    avoiding these busy intervals: ${busy.map(b=>`[${b.start.toISOString()}..${b.end.toISOString()}]`).join(", ")}.
    Prefer ${workHours.start}:00–${workHours.end}:00 local time. Return JSON {startISO, endISO, reason}.`;
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        response_format: { type: "json_object" }
      })
    });
    const ai = await resp.json();
    return NextResponse.json({ ok: true, proposal: JSON.parse(ai.output[0].content[0].text) });
    */

    return NextResponse.json({ ok: false, error: "No free slot found in window." }, { status: 404 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
