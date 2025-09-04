"use client";

export default function CalendarYear({
  date = new Date(),
  calendarFilter = "main",
  selectedCalendarIds = [],
  search = "",
}) {
  const year = date.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-800">
          {year} • Year
        </h2>
        <div className="text-sm text-gray-500">
          Filter: {calendarFilter} {selectedCalendarIds?.length ? `(+${selectedCalendarIds.length} more)` : ""}
          {search ? ` • “${search}”` : ""}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {months.map((m, idx) => (
          <div key={idx} className="border rounded-xl p-3">
            <div className="text-sm font-semibold mb-2">
              {m.toLocaleString(undefined, { month: "long" })}
            </div>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1">
              {["S","M","T","W","T","F","S"].map((d) => <div key={d} className="text-center">{d}</div>)}
            </div>
            {/* super simple 5x7 blocks */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i2) => (
                <div key={i2} className="h-4 rounded bg-gray-50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
