"use client";

export default function AIConsole(){
  return (
    <section
      className="bg-[var(--card-bg)] border border-[var(--outline-neutral)] rounded-[24px] p-6 w-full"
      style={{minHeight:780}}
    >
      <h2 className="text-[22px] font-bold text-[var(--accent-purple)] text-center mb-4">AI Console</h2>
      <label className="text-sm font-medium text-gray-700">Ask LifeHub AI</label>
      <textarea
        rows={7}
        className="mt-2 w-full rounded-[12px] border border-[var(--outline-neutral)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        placeholder="e.g., Rearrange my day to avoid the clash between gym and chemistry…"
      />
      <div className="mt-3 flex gap-4">
        <button className="h-9 px-4 rounded-[20px] font-bold border bg-white text-red-600">Rearrange</button>
        <button className="h-9 px-4 rounded-[20px] font-bold border bg-white text-teal-600">Summary</button>
        <button className="h-9 px-4 rounded-[20px] font-bold border bg-white text-purple-700">Priority list</button>
      </div>
    </section>
  );
}
