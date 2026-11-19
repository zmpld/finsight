// app/dashboard/TimeframeFilter.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown, ArrowRight } from "lucide-react";
import { formatMonthLabel } from "@/utils/date-format";

const controlClass =
  "rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";

export default function TimeframeFilter({
  currentMonth,
}: {
  currentMonth: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPeriod = searchParams.get("period") || currentMonth;
  const currentStart = searchParams.get("start") || "";
  const currentEnd = searchParams.get("end") || "";
  const isCustomRange = Boolean(currentStart || currentEnd);

  const [mode, setMode] = useState<"preset" | "custom">(
    isCustomRange ? "custom" : "preset",
  );
  const [startMonth, setStartMonth] = useState(currentStart || currentMonth);
  const [endMonth, setEndMonth] = useState(currentEnd || currentMonth);

  // Last 12 months, built from the first of the month so day 29-31 can't skip a month
  const monthOptions = (() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { value, label: formatMonthLabel(value) };
    });
  })();

  // Keep an older selected month visible in the dropdown instead of showing blank
  const hasCurrentInOptions = monthOptions.some(
    (o) => o.value === currentPeriod,
  );
  const showExtraOption =
    !isCustomRange && currentPeriod !== "all" && !hasCurrentInOptions;

  // Change period/range while keeping everything else (e.g. the active tab)
  const navigate = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    ["period", "start", "end"].forEach((k) => params.delete(k));
    mutate(params);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/dashboard${qs ? `?${qs}` : ""}`);
    });
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setMode("custom");
      return;
    }
    navigate((p) => p.set("period", value));
  };

  const rangeInvalid = Boolean(startMonth && endMonth && startMonth > endMonth);

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (rangeInvalid) return;
    navigate((p) => {
      if (startMonth) p.set("start", startMonth);
      if (endMonth) p.set("end", endMonth);
    });
  };

  const handleCancel = () => {
    setMode("preset");
    // Only navigate if a custom range is actually applied
    if (isCustomRange) navigate(() => {});
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 transition-opacity ${isPending ? "opacity-60" : ""}`}
      aria-busy={isPending}
    >
      {mode === "preset" ? (
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <select
            aria-label="Reporting period"
            value={currentPeriod}
            onChange={handlePresetChange}
            className={`${controlClass} appearance-none pl-9 pr-9 min-w-[13rem] cursor-pointer`}
          >
            {showExtraOption && (
              <option value={currentPeriod}>
                {formatMonthLabel(currentPeriod)}
              </option>
            )}
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {opt.value === currentMonth ? " (current)" : ""}
              </option>
            ))}
            <option value="all">All-time history</option>
            <option value="custom">Custom range…</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        </div>
      ) : (
        <form
          onSubmit={handleCustomApply}
          className="flex flex-wrap items-end gap-2"
        >
          <div>
            <label
              htmlFor="tf-start"
              className="block text-xs text-slate-400 mb-1"
            >
              From
            </label>
            <input
              id="tf-start"
              type="month"
              value={startMonth}
              max={endMonth || undefined}
              onChange={(e) => setStartMonth(e.target.value)}
              className={controlClass}
            />
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 mb-2.5 hidden sm:block" />
          <div>
            <label
              htmlFor="tf-end"
              className="block text-xs text-slate-400 mb-1"
            >
              To
            </label>
            <input
              id="tf-end"
              type="month"
              value={endMonth}
              min={startMonth || undefined}
              onChange={(e) => setEndMonth(e.target.value)}
              className={controlClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={rangeInvalid || isPending}
              className={`px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={`px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${focusRing}`}
            >
              Cancel
            </button>
          </div>
          {rangeInvalid && (
            <p role="alert" className="basis-full text-xs text-red-400">
              The start month must be on or before the end month.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
