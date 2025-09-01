"use client";

export default function CalendarTabs({
  value = "main",
  onChange = () => {},
  calendars = [], // optional external list
  onCalendarsDiscovered = () => {},
}) {
  // page will pass us discovered calendars from CalendarDay via onCalendarsDiscovered.
  const tabs = [{ id: "main", name: "Main" }, ...calendars];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-600">Select Calendar:</span>
      <div className="flex items-center gap-2">
        {tabs.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={[
                "h-8 px-4 rounded-xl border text-sm transition",
                active
                  ? "bg-white border-gray-300 font-semibold text-gray-900 shadow-sm"
                  : "bg-white border-gray-300 text-gray-500 hover:text-gray-700",
              ].join(" ")}
              aria-pressed={active}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
