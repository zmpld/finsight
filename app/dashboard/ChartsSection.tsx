// app/dashboard/ChartsSection.tsx
"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Layers,
  ShieldAlert,
  X,
  Eye,
  Calendar,
  Tag,
  ChevronRight,
} from "lucide-react";
import { formatMonthLabel } from "@/utils/date-format";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

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

  // Drill-through panel state with selection tracking for highlighting
  const [drillThroughData, setDrillThroughData] = useState<{
    title: string;
    subtitle: string;
    selectedKey: string;
    transactions: any[];
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent server-side rendering mismatch for Recharts
  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-80 flex items-center justify-center text-slate-500 text-sm">
          Loading analytics...
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-80 flex items-center justify-center text-slate-500 text-sm">
          Loading analytics...
        </div>
      </div>
    );
  }

  // Helper to safely extract category name
  const getCategoryName = (catRef: any) => {
    if (!catRef) return "Unassigned";
    if (Array.isArray(catRef)) return catRef[0]?.name || "Unassigned";
    return catRef.name || "Unassigned";
  };

  // Helper for Peso currency formatting with commas
  const formatPeso = (val: number | string) => {
    return `₱${Number(val).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // 1. Expense Breakdown Data
  const expenseMap: { [key: string]: number } = {};
  let totalExpenseAmount = 0;
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const catName = getCategoryName(t.categories);
      const amt = Number(t.amount);
      expenseMap[catName] = (expenseMap[catName] || 0) + amt;
      totalExpenseAmount += amt;
    });

  const pieData = Object.keys(expenseMap)
    .map((key) => ({
      name: key,
      value: expenseMap[key],
    }))
    .sort((a, b) => b.value - a.value);

  // 2. Income Breakdown Data
  const incomeMap: { [key: string]: number } = {};
  let totalIncomeAmount = 0;
  transactions
    .filter((t) => t.type === "income")
    .forEach((t) => {
      const catName = getCategoryName(t.categories);
      const amt = Number(t.amount);
      incomeMap[catName] = (incomeMap[catName] || 0) + amt;
      totalIncomeAmount += amt;
    });

  const incomePieData = Object.keys(incomeMap)
    .map((key) => ({
      name: key,
      value: incomeMap[key],
    }))
    .sort((a, b) => b.value - a.value);

  // 3. Monthly Trend Data & Net Savings Calculation per Month
  const monthlyMap: { [key: string]: { income: number; expense: number } } = {};
  transactions.forEach((t) => {
    const month = t.transaction_date.substring(0, 7); // 'YYYY-MM'
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 };
    if (t.type === "income") monthlyMap[month].income += Number(t.amount);
    if (t.type === "expense") monthlyMap[month].expense += Number(t.amount);
  });

  const barData = Object.keys(monthlyMap)
    .sort()
    .map((month) => {
      const inc = monthlyMap[month].income;
      const exp = monthlyMap[month].expense;
      return {
        month,
        Income: inc,
        Expense: exp,
        Net: inc - exp,
      };
    });

  // Drill-through Handlers
  const handleExpensePieClick = (entry: any) => {
    if (!enableDrillThrough) return;
    const categoryName = entry.name;
    const matched = transactions.filter(
      (t) =>
        t.type === "expense" && getCategoryName(t.categories) === categoryName,
    );
    setDrillThroughData({
      title: `${categoryName}`,
      subtitle: `Expense breakdown (${formatPeso(entry.value)})`,
      selectedKey: categoryName,
      transactions: matched,
    });
  };

  const handleIncomePieClick = (entry: any) => {
    if (!enableDrillThrough) return;
    const categoryName = entry.name;
    const matched = transactions.filter(
      (t) =>
        t.type === "income" && getCategoryName(t.categories) === categoryName,
    );
    setDrillThroughData({
      title: `${categoryName}`,
      subtitle: `Income stream (${formatPeso(entry.value)})`,
      selectedKey: categoryName,
      transactions: matched,
    });
  };

  const handleBarClick = (data: any, barType?: string) => {
    if (!enableDrillThrough || !data || !data.month) return;
    const monthKey = data.month;
    const formattedTitleMonth = formatMonthLabel(monthKey);

    let matched = transactions.filter((t) =>
      t.transaction_date?.startsWith(monthKey),
    );
    if (barType === "Income") {
      matched = matched.filter((t) => t.type === "income");
    } else if (barType === "Expense") {
      matched = matched.filter((t) => t.type === "expense");
    }

    setDrillThroughData({
      title: `${formattedTitleMonth} ${barType ? `(${barType})` : ""}`,
      subtitle: `Monthly ledger inspection`,
      selectedKey: `${monthKey}-${barType || "all"}`,
      transactions: matched,
    });
  };

  const showInspector = enableDrillThrough && drillThroughData;

  return (
    <div className="space-y-8 relative">
      {/* Analytics Sub-Header / Quick Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
              Expense Categories Tracked
            </span>
            <span className="text-xl font-bold text-white mt-1 block">
              {pieData.length} Active
            </span>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
              Income Streams Tracked
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">
              {incomePieData.length} Sources
            </span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">
              Largest Single Outflow
            </span>
            <span className="text-xl font-bold text-rose-400 mt-1 block">
              {pieData.length > 0
                ? formatPeso(pieData[0].value)
                : formatPeso(0)}
            </span>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Layout Grid with Side Drill-Through Panel */}
      <div
        className={`grid grid-cols-1 ${showInspector ? "xl:grid-cols-3" : ""} gap-8 items-start`}
      >
        {/* Charts Column */}
        <div
          className={`${showInspector ? "xl:col-span-2" : "xl:col-span-3"} grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-300`}
        >
          {/* Expense Breakdown Donut Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-white">
                  Spending Breakdown by Category
                </h2>
                <span className="text-xs text-slate-400">
                  Total: {formatPeso(totalExpenseAmount)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Detailed percentage concentration of your expenses.
              </p>
            </div>

            {pieData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      onClick={(entry) => handleExpensePieClick(entry)}
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                      label={
                        showInspector ? false : ({ value }) => formatPeso(value)
                      }
                      labelLine={!showInspector}
                      style={{
                        cursor: enableDrillThrough ? "pointer" : "default",
                      }}
                    >
                      {pieData.map((entry, index) => {
                        const isSelected =
                          enableDrillThrough &&
                          drillThroughData?.selectedKey === entry.name;
                        const isHovered = activePieIndex === index;
                        const color = COLORS[index % COLORS.length];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={color}
                            stroke={isSelected ? "#ffffff" : undefined}
                            strokeWidth={isSelected ? 2 : 1}
                            style={{
                              filter:
                                isHovered || isSelected
                                  ? `drop-shadow(0px 0px 12px ${color})`
                                  : "none",
                              opacity:
                                activePieIndex !== null &&
                                !isHovered &&
                                !isSelected
                                  ? 0.4
                                  : 1,
                              transition: "all 0.3s ease-in-out",
                              cursor: enableDrillThrough
                                ? "pointer"
                                : "default",
                            }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: "0.5rem",
                        color: "#f8fafc",
                      }}
                      formatter={(value: any) => [formatPeso(value)]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-500">
                No expense data available
              </div>
            )}
          </div>

          {/* Income Breakdown Donut Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-white">
                  Income Breakdown by Category
                </h2>
                <span className="text-xs text-slate-400">
                  Total: {formatPeso(totalIncomeAmount)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Detailed distribution across earnings streams.
              </p>
            </div>

            {incomePieData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      onClick={(entry) => handleIncomePieClick(entry)}
                      onMouseEnter={(_, index) => setActiveIncomeIndex(index)}
                      onMouseLeave={() => setActiveIncomeIndex(null)}
                      label={
                        showInspector ? false : ({ value }) => formatPeso(value)
                      }
                      labelLine={!showInspector}
                      style={{
                        cursor: enableDrillThrough ? "pointer" : "default",
                      }}
                    >
                      {incomePieData.map((entry, index) => {
                        const isSelected =
                          enableDrillThrough &&
                          drillThroughData?.selectedKey === entry.name;
                        const isHovered = activeIncomeIndex === index;
                        const color = COLORS[index % COLORS.length];
                        return (
                          <Cell
                            key={`cell-income-${index}`}
                            fill={color}
                            stroke={isSelected ? "#ffffff" : undefined}
                            strokeWidth={isSelected ? 2 : 1}
                            style={{
                              filter:
                                isHovered || isSelected
                                  ? `drop-shadow(0px 0px 12px ${color})`
                                  : "none",
                              opacity:
                                activeIncomeIndex !== null &&
                                !isHovered &&
                                !isSelected
                                  ? 0.4
                                  : 1,
                              transition: "all 0.3s ease-in-out",
                              cursor: enableDrillThrough
                                ? "pointer"
                                : "default",
                            }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: "0.5rem",
                        color: "#f8fafc",
                      }}
                      formatter={(value: any) => [formatPeso(value)]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-500">
                No income data available
              </div>
            )}
          </div>

          {/* Monthly Cash Flow Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Monthly Cash Flow Trends &amp; Net Trajectory
                </h2>
                <p className="text-xs text-slate-400">
                  Comparison of monthly inflows against outflows with net
                  surplus tracking.
                </p>
              </div>
            </div>

            {barData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(val) => formatMonthLabel(val)}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickFormatter={(val) => `₱${val.toLocaleString()}`}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1e293b",
                        borderRadius: "0.5rem",
                        color: "#f8fafc",
                      }}
                      labelFormatter={(label: any) => formatMonthLabel(label)}
                      formatter={(value: any) => [formatPeso(value)]}
                    />
                    <Legend />
                    <Bar
                      dataKey="Income"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      onClick={(data) => handleBarClick(data, "Income")}
                      style={{
                        cursor: enableDrillThrough ? "pointer" : "default",
                      }}
                      activeBar={{
                        fill: "#34d399",
                        stroke: "#10b981",
                        strokeWidth: 2,
                        style: { filter: "drop-shadow(0px 0px 10px #10b981)" },
                      }}
                    />
                    <Bar
                      dataKey="Expense"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      onClick={(data) => handleBarClick(data, "Expense")}
                      style={{
                        cursor: enableDrillThrough ? "pointer" : "default",
                      }}
                      activeBar={{
                        fill: "#f87171",
                        stroke: "#ef4444",
                        strokeWidth: 2,
                        style: { filter: "drop-shadow(0px 0px 10px #ef4444)" },
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-500">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Side Drill-Through Inspector Panel */}
        {showInspector && drillThroughData && (
          <div className="bg-slate-900 border border-blue-500/40 rounded-2xl flex flex-col shadow-2xl overflow-hidden sticky top-6 animate-in slide-in-from-right duration-200">
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <ChevronRight className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold block">
                    INSPECTOR
                  </span>
                  <h3 className="text-sm font-bold text-white truncate max-w-[200px]">
                    {drillThroughData.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDrillThroughData(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Body / Transaction List */}
            <div className="p-4 overflow-y-auto max-h-[500px] space-y-2.5">
              <p className="text-[11px] text-slate-400 pb-1 border-b border-slate-800/60">
                {drillThroughData.subtitle} (
                {drillThroughData.transactions.length} items)
              </p>

              {drillThroughData.transactions.length > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  {drillThroughData.transactions.map((t, idx) => {
                    const catName = getCategoryName(t.categories);
                    const isIncome = t.type === "income";
                    return (
                      <div
                        key={t.id || idx}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isIncome ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {t.description || "Untitled Transaction"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              <span className="flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" />
                                {t.transaction_date ||
                                  t.created_at?.substring(0, 10)}
                              </span>
                              <span className="truncate">· {catName}</span>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-xs font-bold whitespace-nowrap ${isIncome ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatPeso(t.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No individual records found.
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Selected item active</span>
              <button
                onClick={() => setDrillThroughData(null)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
