// app/dashboard/TimeframeFilter.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, ArrowRight } from "lucide-react";
import { formatMonthLabel } from "@/utils/date-format";

export default function TimeframeFilter({
  currentMonth,
}: {
  currentMonth: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") || currentMonth;
  const currentStart = searchParams.get("start") || "";
  const currentEnd = searchParams.get("end") || "";

  const isCustomRange = Boolean(currentStart || currentEnd);

  const [mode, setMode] = useState<"preset" | "custom">(
    isCustomRange ? "custom" : "preset",
  );
  const [startMonth, setStartMonth] = useState(currentStart || currentMonth);
  const [endMonth, setEndMonth] = useState(currentEnd || currentMonth);

  const generateMonthOptions = () => {
    const options = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const val = `${year}-${month}`;
      options.push({
        value: val,
        label: formatMonthLabel(val),
      });
      date.setMonth(date.getMonth() - 1);
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams();
    if (value === "custom_toggle") {
      setMode("custom");
      return;
    }
    if (value && value !== "all") {
      params.set("period", value);
    } else if (value === "all") {
      params.set("period", "all");
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (startMonth) params.set("start", startMonth);
    if (endMonth) params.set("end", endMonth);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-medium">
        <Filter className="h-4 w-4 text-blue-400" />
        <span>Timeframe</span>
      </div>

      {mode === "preset" ? (
        <div className="flex items-center gap-2">
          <select
            value={isCustomRange ? "custom_toggle" : currentPeriod}
            onChange={handlePresetChange}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.value === currentMonth ? "(Current)" : ""}
              </option>
            ))}
            <option value="all">All-Time History</option>
            <option value="custom_toggle">
              ⚙️ Choose Custom Range (e.g., April to July)...
            </option>
          </select>
        </div>
      ) : (
        <form
          onSubmit={handleCustomApply}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("preset");
              router.push("/dashboard");
            }}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
