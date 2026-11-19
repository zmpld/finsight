// app/dashboard/ChartsSection.tsx
"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Layers, ShieldAlert, X, Calendar } from "lucide-react";
import { formatMonthLabel } from "@/utils/date-format";

/* Categorical palette: deliberately avoids pure red/green so those
   stay reserved for income / expense meaning elsewhere. */
const COLORS = [
  "#3b82f6",
  "#14b8a6",
  "#f59e0b",
  "#a78bfa",
  "#f472b6",
  "#22d3ee",
  "#94a3b8",
  "#fb923c",
];

const SEMANTIC = {
  income: "#10b981",
  expense: "#ef4444",
  net: "#60a5fa",
};

const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };

const getCategoryName = (catRef: any) => {
  if (!catRef) return "Unassigned";
  if (Array.isArray(catRef)) return catRef[0]?.name || "Unassigned";
  return catRef.name || "Unassigned";
};

const formatPeso = (val: number | string) =>
  `₱${Number(val).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const compactPeso = (val: number) =>
  `₱${new Intl.NumberFormat("en-PH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(val)}`;

const cardClass = "rounded-xl border border-slate-800 bg-slate-900/60";

type Slice = { name: string; value: number };

/* ------------------------------ Small parts ------------------------------ */
function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: any;
  iconClass: string;
}) {
  return (
    <div className={`${cardClass} p-4 flex items-center justify-between gap-3`}>
      <div className="min-w-0">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-xl font-semibold text-white mt-1 tabular-nums truncate">
          {value}
        </p>
        {hint && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{hint}</p>
        )}
      </div>
      <div
        className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function DonutCard({
  title,
  description,
  totalLabel,
  data,
  total,
  emptyText,
  enabled,
  selectedKey,
  activeIndex,
  setActiveIndex,
  onSelect,
}: {
  title: string;
  description: string;
  totalLabel: string;
  data: Slice[];
  total: number;
  emptyText: string;
  enabled: boolean;
  selectedKey?: string;
  activeIndex: number | null;
  setActiveIndex: (i: number | null) => void;
  onSelect: (s: Slice) => void;
}) {
  const active = activeIndex !== null ? data[activeIndex] : null;
  const centerName = active ? active.name : totalLabel;
  const centerValue = active ? active.value : total;

  return (
    <div className={`${cardClass} flex flex-col`}>
      <div className="px-5 py-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>

      {data.length > 0 ? (
        <div className="p-5 space-y-5">
          <div className="relative h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={98}
                  paddingAngle={2}
                  stroke="none"
                  animationDuration={600}
                  onClick={(entry) => enabled && onSelect(entry as any)}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => {
                    const isSelected = enabled && selectedKey === entry.name;
                    const dimmed =
                      activeIndex !== null &&
                      activeIndex !== index &&
                      !isSelected;
                    return (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                        stroke={isSelected ? "#f8fafc" : "none"}
                        strokeWidth={isSelected ? 2 : 0}
                        style={{
                          opacity: dimmed ? 0.35 : 1,
                          transition: "opacity 0.2s ease",
                          cursor: enabled ? "pointer" : "default",
                          outline: "none",
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centre readout */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-16">
              <span className="text-xs text-slate-400 max-w-full truncate">
                {centerName}
              </span>
              <span className="text-base font-semibold text-white tabular-nums">
                {formatPeso(centerValue)}
              </span>
              {active && total > 0 && (
                <span className="text-xs text-slate-500">
                  {Math.round((active.value / total) * 100)}% of total
                </span>
              )}
            </div>
          </div>

          {/* Legend doubles as a ranked breakdown */}
          <ul className="max-h-44 overflow-y-auto divide-y divide-slate-800/70 -mx-1">
            {data.map((entry, index) => {
              const share =
                total > 0 ? Math.round((entry.value / total) * 100) : 0;
              const isSelected = enabled && selectedKey === entry.name;
              return (
                <li key={entry.name}>
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => onSelect(entry)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left text-sm transition-colors disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${
                      isSelected
                        ? "bg-slate-800"
                        : enabled
                          ? "hover:bg-slate-800/60"
                          : ""
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="flex-1 truncate text-slate-200">
                      {entry.name}
                    </span>
                    <span className="text-slate-300 tabular-nums">
                      {formatPeso(entry.value)}
                    </span>
                    <span className="w-9 text-right text-slate-500 tabular-nums">
                      {share}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="h-72 flex items-center justify-center text-sm text-slate-500 px-6 text-center">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function FlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 shadow-lg text-xs min-w-[170px]">
      <p className="font-semibold text-slate-100 mb-2">
        {formatMonthLabel(label)}
      </p>
      <div className="space-y-1.5">
        {payload.map((p: any) => (
          <div
            key={p.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-slate-400">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color || p.stroke }}
              />
              {p.name}
            </span>
            <span className="text-slate-100 tabular-nums font-medium">
              {p.value < 0 ? "-" : ""}
              {formatPeso(Math.abs(p.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Main component ------------------------------ */
export default function ChartsSection({
  transactions,
  enableDrillThrough = true,
}: {
  transactions: any[];
  enableDrillThrough?: boolean;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [activeIncomeIndex, setActiveIncomeIndex] = useState<number | null>(
    null,
  );

  const [drillThroughData, setDrillThroughData] = useState<{
    title: string;
    subtitle: string;
    selectedKey: string;
    transactions: any[];
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close the inspector with Escape
  useEffect(() => {
    if (!drillThroughData) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrillThroughData(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drillThroughData]);

  // Prevent SSR mismatch for Recharts
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${cardClass} h-[88px] animate-pulse`} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${cardClass} h-96 animate-pulse`} />
          <div className={`${cardClass} h-96 animate-pulse`} />
        </div>
      </div>
    );
  }

  /* ---- Data prep ---- */
  const buildBreakdown = (type: "expense" | "income") => {
    const map: Record<string, number> = {};
    let total = 0;
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        const name = getCategoryName(t.categories);
        const amt = Number(t.amount);
        map[name] = (map[name] || 0) + amt;
        total += amt;
      });
    const data: Slice[] = Object.keys(map)
      .map((name) => ({ name, value: map[name] }))
      .sort((a, b) => b.value - a.value);
    return { data, total };
  };

  const { data: pieData, total: totalExpenseAmount } =
    buildBreakdown("expense");
  const { data: incomePieData, total: totalIncomeAmount } =
    buildBreakdown("income");

  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  transactions.forEach((t) => {
    if (!t.transaction_date) return;
    const month = t.transaction_date.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 };
    if (t.type === "income") monthlyMap[month].income += Number(t.amount);
    if (t.type === "expense") monthlyMap[month].expense += Number(t.amount);
  });

  const barData = Object.keys(monthlyMap)
    .sort()
    .map((month) => {
      const { income, expense } = monthlyMap[month];
      return { month, Income: income, Expense: expense, Net: income - expense };
    });

  /* ---- Drill-through handlers ---- */
  const selectSlice = (type: "expense" | "income") => (entry: Slice) => {
    if (!enableDrillThrough) return;
    const matched = transactions.filter(
      (t) => t.type === type && getCategoryName(t.categories) === entry.name,
    );
    setDrillThroughData({
      title: entry.name,
      subtitle: `${type === "expense" ? "Expenses" : "Income"} · ${formatPeso(entry.value)}`,
      selectedKey: entry.name,
      transactions: matched,
    });
  };

  const handleBarClick = (data: any, barType?: string) => {
    if (!enableDrillThrough || !data || !data.month) return;
    const monthKey = data.month;
    let matched = transactions.filter((t) =>
      t.transaction_date?.startsWith(monthKey),
    );
    if (barType === "Income")
      matched = matched.filter((t) => t.type === "income");
    else if (barType === "Expense")
      matched = matched.filter((t) => t.type === "expense");

    setDrillThroughData({
      title: `${formatMonthLabel(monthKey)}${barType ? ` (${barType})` : ""}`,
      subtitle: "Monthly transactions",
      selectedKey: `${monthKey}-${barType || "all"}`,
      transactions: matched,
    });
  };

  const showInspector = enableDrillThrough && drillThroughData;
  const inspectorTotal = drillThroughData
    ? drillThroughData.transactions.reduce(
        (acc, t) => acc + (t.type === "income" ? 1 : -1) * Number(t.amount),
        0,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Quick metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Expense categories"
          value={`${pieData.length} tracked`}
          icon={Layers}
          iconClass="bg-blue-500/10 text-blue-400"
        />
        <StatTile
          label="Income sources"
          value={`${incomePieData.length} tracked`}
          icon={TrendingUp}
          iconClass="bg-emerald-500/10 text-emerald-400"
        />
        <StatTile
          label="Largest expense category"
          value={
            pieData.length > 0 ? formatPeso(pieData[0].value) : formatPeso(0)
          }
          hint={pieData.length > 0 ? pieData[0].name : undefined}
          icon={ShieldAlert}
          iconClass="bg-red-500/10 text-red-400"
        />
      </div>

      <div
        className={`grid grid-cols-1 ${showInspector ? "xl:grid-cols-3" : ""} gap-6 items-start`}
      >
        {/* Charts column */}
        <div
          className={`${showInspector ? "xl:col-span-2" : "xl:col-span-3"} grid grid-cols-1 lg:grid-cols-2 gap-6`}
        >
          <DonutCard
            title="Spending by category"
            description={
              enableDrillThrough
                ? "Select a category to inspect its transactions."
                : "Share of total expenses."
            }
            totalLabel="Total spent"
            data={pieData}
            total={totalExpenseAmount}
            emptyText="No expenses in this period."
            enabled={enableDrillThrough}
            selectedKey={drillThroughData?.selectedKey}
            activeIndex={activePieIndex}
            setActiveIndex={setActivePieIndex}
            onSelect={selectSlice("expense")}
          />

          <DonutCard
            title="Income by category"
            description={
              enableDrillThrough
                ? "Select a source to inspect its deposits."
                : "Distribution across income sources."
            }
            totalLabel="Total earned"
            data={incomePieData}
            total={totalIncomeAmount}
            emptyText="No income in this period."
            enabled={enableDrillThrough}
            selectedKey={drillThroughData?.selectedKey}
            activeIndex={activeIncomeIndex}
            setActiveIndex={setActiveIncomeIndex}
            onSelect={selectSlice("income")}
          />

          {/* Monthly cash flow */}
          <div className={`${cardClass} lg:col-span-2`}>
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">
                Monthly cash flow
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Income and expenses per month, with the net result as a line.
              </p>
            </div>

            {barData.length > 0 ? (
              <div className="p-5">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={barData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={{ stroke: "#1e293b" }}
                        tickMargin={8}
                        tickFormatter={(val) => formatMonthLabel(val)}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tickFormatter={(val) => compactPeso(val)}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                        content={<FlowTooltip />}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{
                          fontSize: 12,
                          paddingTop: 12,
                          color: "#cbd5e1",
                        }}
                      />
                      <Bar
                        dataKey="Income"
                        fill={SEMANTIC.income}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                        animationDuration={600}
                        onClick={(data) => handleBarClick(data, "Income")}
                        style={{
                          cursor: enableDrillThrough ? "pointer" : "default",
                        }}
                      />
                      <Bar
                        dataKey="Expense"
                        fill={SEMANTIC.expense}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                        animationDuration={600}
                        onClick={(data) => handleBarClick(data, "Expense")}
                        style={{
                          cursor: enableDrillThrough ? "pointer" : "default",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Net"
                        name="Net"
                        stroke={SEMANTIC.net}
                        strokeWidth={2}
                        dot={{ r: 3, fill: SEMANTIC.net, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        animationDuration={800}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-sm text-slate-500">
                No monthly data for this period.
              </div>
            )}
          </div>
        </div>

        {/* Inspector */}
        {showInspector && drillThroughData && (
          <aside
            aria-label="Transaction details"
            className="rounded-xl border border-slate-700 bg-slate-900 flex flex-col overflow-hidden xl:sticky xl:top-6"
          >
            <div className="px-4 py-3.5 border-b border-slate-800 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {drillThroughData.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {drillThroughData.subtitle}
                </p>
              </div>
              <button
                onClick={() => setDrillThroughData(null)}
                aria-label="Close details"
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
              <span>{drillThroughData.transactions.length} transactions</span>
              <span
                className={`font-semibold tabular-nums ${
                  inspectorTotal >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                Net {inspectorTotal < 0 ? "-" : ""}
                {formatPeso(Math.abs(inspectorTotal))}
              </span>
            </div>

            <div className="overflow-y-auto max-h-[480px]">
              {drillThroughData.transactions.length > 0 ? (
                <ul className="divide-y divide-slate-800/70">
                  {drillThroughData.transactions.map((t, idx) => {
                    const isIncome = t.type === "income";
                    return (
                      <li
                        key={t.id || idx}
                        className="px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate-100 truncate">
                            {t.description || "Untitled transaction"}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>
                              {t.transaction_date ||
                                t.created_at?.substring(0, 10)}
                            </span>
                            <span className="truncate">
                              {getCategoryName(t.categories)}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`text-sm font-medium whitespace-nowrap tabular-nums ${
                            isIncome ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatPeso(t.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  No transactions found.
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setDrillThroughData(null)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear selection
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
