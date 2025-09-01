"use client";

import { useState } from "react";

export default function AIConsole() {
  const [text, setText] = useState("");

  const run = (mode) => {
    if (!text.trim()) {
      alert("Type something first.");
      return;
    }
    if (mode === "rearrange") {
      alert("AI rearrange (stub): would analyze conflicts and propose a plan.");
    } else if (mode === "summary") {
      alert("AI summary (stub): would summarize your day across calendars.");
    } else if (mode === "priority") {
      alert("AI priority (stub): would rank items by priority.");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
        AI Console
      </h2>
      <textarea
        rows={5}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Ask LifeHub AI…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => run("rearrange")}
          className="h-9 px-4 rounded-full bg-white border border-gray-300 text-sm font-semibold"
        >
          Rearrange
        </button>
        <button
          onClick={() => run("summary")}
          className="h-9 px-4 rounded-full bg-white border border-gray-300 text-sm font-semibold"
        >
          Summary
        </button>
        <button
          onClick={() => run("priority")}
          className="h-9 px-4 rounded-full bg-white border border-gray-300 text-sm font-semibold"
        >
          Priority list
        </button>
      </div>
    </div>
  );
}
