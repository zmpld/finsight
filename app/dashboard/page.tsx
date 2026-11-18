// app/dashboard/page.tsx
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import dynamic from "next/dynamic";
import { importTransactionsCSV } from "./csv-actions";
import BudgetSection from "./BudgetSection";
import AIInsightsSection from "./AIInsightsSection";
import TransactionsSection from "./TransactionsSection";
import TimeframeFilter from "./TimeframeFilter";
import AddTransactionSection from "./AddTransactionSection";
import DashboardSidebar from "./DashboardSidebar";
import SettingsSection from "./SettingsSection";
import { formatMonthLabel } from "@/utils/date-format";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Upload,
  PiggyBank,
  CalendarDays,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const ChartsSection = dynamic(() => import("./ChartsSection"), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-80 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
      <div className="h-80 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
    </div>
  ),
});

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <div className="w-64 bg-slate-900 border-r border-slate-800 animate-pulse" />
      <div className="flex-1 p-8 space-y-8 animate-pulse">
        <div className="h-16 rounded-xl bg-slate-900 border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 rounded-2xl bg-slate-900 border border-slate-800" />
          <div className="h-28 rounded-2xl bg-slate-900 border border-slate-800" />
          <div className="h-28 rounded-2xl bg-slate-900 border border-slate-800" />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
    tab?: string;
  }>;
}) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
    tab?: string;
  }>;
}) {
  await connection();
  const resolvedSearchParams = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Helper for Peso currency formatting with commas
  const formatPeso = (val: number | string, decimals = 2) => {
    return `₱${Number(val).toLocaleString("en-PH", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });
  const currentMonth = today.substring(0, 7);

  const periodParam = resolvedSearchParams.period;
  const startParam = resolvedSearchParams.start;
  const endParam = resolvedSearchParams.end;
  const activeTab = resolvedSearchParams.tab || "overview";

  const isCustomRange = Boolean(startParam || endParam);
  const activeBudgetMonth =
    !isCustomRange && periodParam && periodParam !== "all"
      ? periodParam
      : currentMonth;

  let displayLabel = formatMonthLabel(currentMonth);

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "there";

  const [{ data: rawCategories }, { data: transactions }, { data: budgets }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("id, name, type, color, is_default, user_id")
        .or(`user_id.eq.${user.id},is_default.eq.true`),
      supabase
        .from("transactions")
        .select(
          "id, type, amount, description, transaction_date, created_at, category_id, categories(name, color)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("budgets")
        .select("id, category_id, monthly_limit, month_year, categories(name)")
        .eq("user_id", user.id)
        .eq("month_year", activeBudgetMonth),
    ]);

  const categoryMap = new Map();
  for (const cat of rawCategories || []) {
    const uniqueKey = `${cat.name?.trim().toLowerCase()}-${cat.type}`;
    if (!categoryMap.has(uniqueKey)) {
      categoryMap.set(uniqueKey, cat);
    }
  }
  const categories = Array.from(categoryMap.values());

  const ledger = transactions || [];

  const filteredTransactions = ledger.filter((t) => {
    const txDate = t.transaction_date;
    if (!txDate) return false;
    const txMonth = txDate.substring(0, 7);

    if (startParam && endParam) {
      displayLabel = `${formatMonthLabel(startParam)} to ${formatMonthLabel(endParam)}`;
      return txMonth >= startParam && txMonth <= endParam;
    }
    if (startParam && !endParam) {
      displayLabel = `From ${formatMonthLabel(startParam)}`;
      return txMonth >= startParam;
    }
    if (!startParam && endParam) {
      displayLabel = `Up to ${formatMonthLabel(endParam)}`;
      return txMonth <= endParam;
    }
    if (periodParam === "all") {
      displayLabel = "All-Time History";
      return true;
    }
    const targetPeriod = periodParam || currentMonth;
    displayLabel = formatMonthLabel(targetPeriod);
    return txMonth === targetPeriod;
  });

  const recentTransactions = filteredTransactions;

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : null;

  const categoryLabel = (
    categoriesRef: { name?: string } | { name?: string }[] | null | undefined,
  ) => {
    if (!categoriesRef) return "Unassigned";
    if (Array.isArray(categoriesRef))
      return categoriesRef[0]?.name || "Unassigned";
    return categoriesRef.name || "Unassigned";
  };

  // Top Spending Category
  const topCategory = (() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const name = categoryLabel(t.categories);
        map[name] = (map[name] || 0) + Number(t.amount);
      });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries[0] || null;
  })();

  // Income Sources Summary (for Period Income subtitle)
  const incomeSourcesLabel = (() => {
    const sources = Array.from(
      new Set(
        filteredTransactions
          .filter((t) => t.type === "income")
          .map((t) => categoryLabel(t.categories)),
      ),
    );
    if (sources.length === 0) return "No deposits recorded this period";
    if (sources.length === 1) return `${sources[0]} Deposits`;
    return `${sources.slice(0, 2).join(" & ")} Deposits`;
  })();

  // Month-over-Month Net Cash Flow Comparison
  const momChange = (() => {
    if (isCustomRange || periodParam === "all") return null;
    const targetMonth = periodParam || currentMonth;
    const [yearStr, monthStr] = targetMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return null;

    const prevDate = new Date(year, month - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

    const prevTxs = ledger.filter((t) =>
      t.transaction_date?.startsWith(prevMonth),
    );
    if (prevTxs.length === 0) return null;

    const prevIncome = prevTxs
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const prevExpense = prevTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const prevNet = prevIncome - prevExpense;

    if (prevNet === 0) return null;
    const pct = ((netBalance - prevNet) / Math.abs(prevNet)) * 100;
    return Number(pct.toFixed(1));
  })();

  // Total Budget & Usage Percentage
  const totalBudgetLimit = (budgets || []).reduce(
    (acc, b) => acc + Number(b.monthly_limit || 0),
    0,
  );
  const budgetUsedPct =
    totalBudgetLimit > 0
      ? Math.round((totalExpense / totalBudgetLimit) * 100)
      : null;

  // Expense-to-Income Ratio for Summary Bar
  const expenseRatio =
    totalIncome > 0
      ? Math.min(100, Math.round((totalExpense / totalIncome) * 100))
      : totalExpense > 0
        ? 100
        : 0;

  const topSpendShare =
    totalExpense > 0 && topCategory
      ? Math.round((topCategory[1] / totalExpense) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Left Sidebar Navigation */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-8 lg:p-10 space-y-8">
        {/* Top Header & Timeframe Filter */}
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Active Analytics Scope:{" "}
              <span className="text-blue-400 font-semibold">
                {displayLabel}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TimeframeFilter currentMonth={currentMonth} />
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top 3 KPI Cards with Landing-Page Accuracy & Subtitles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Net Cash Flow Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                      Period Net Cash Flow
                    </p>
                    <p
                      className={`text-3xl font-bold mt-2 tracking-tight ${
                        netBalance < 0 ? "text-red-400" : "text-white"
                      }`}
                    >
                      {netBalance < 0
                        ? `-${formatPeso(Math.abs(netBalance))}`
                        : formatPeso(netBalance)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Wallet className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center gap-1.5 text-xs font-medium">
                  {momChange !== null ? (
                    momChange >= 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />+{momChange}% from
                        last month
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {momChange}% from last month
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400">
                      {netBalance >= 0
                        ? "Positive net cash position"
                        : "Net cash deficit in period"}
                    </span>
                  )}
                </div>
              </div>

              {/* Period Income Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-emerald-400 font-medium">
                      Period Income
                    </p>
                    <p className="text-3xl font-bold text-emerald-400 mt-2 tracking-tight">
                      {formatPeso(totalIncome)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/70 text-xs text-slate-400 font-medium truncate">
                  {incomeSourcesLabel}
                </div>
              </div>

              {/* Period Expenses Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-red-400 font-medium">
                      Period Expenses
                    </p>
                    <p className="text-3xl font-bold text-red-400 mt-2 tracking-tight">
                      {formatPeso(totalExpense)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/70 text-xs font-medium">
                  {budgetUsedPct !== null ? (
                    <span
                      className={
                        budgetUsedPct > 100
                          ? "text-red-400"
                          : budgetUsedPct > 80
                            ? "text-amber-400"
                            : "text-slate-400"
                      }
                    >
                      {budgetUsedPct}% of {formatPeso(totalBudgetLimit, 0)}{" "}
                      budget used
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      {
                        filteredTransactions.filter((t) => t.type === "expense")
                          .length
                      }{" "}
                      expense transactions logged
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Active Range Summary Card */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-400 font-semibold mb-4">
                <CalendarDays className="h-4 w-4" />
                Active Range Summary · {displayLabel}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <p className="text-xs text-slate-400">Savings Rate</p>
                  <p className="text-xl font-bold text-slate-100 mt-1">
                    {savingsRate === null ? "—" : `${savingsRate}%`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Top Spend Category</p>
                  <p className="text-xl font-bold text-slate-100 mt-1">
                    {topCategory
                      ? `${topCategory[0]} (${formatPeso(topCategory[1])})`
                      : "None"}
                  </p>
                </div>
                <div className="flex items-center sm:justify-end">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Charts & Visual Report Analysis */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Summary Charts &amp; Financial Report Analysis
                    </h2>
                    <p className="text-xs text-slate-400">
                      Automated breakdown of cash flow efficiency and spending
                      concentration for {displayLabel}.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 self-start sm:self-auto">
                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                  {filteredTransactions.length} Total Transactions
                </span>
              </div>

              {/* Mini Summary Progress Bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Expense-to-Income Burn Ratio */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      Income Utilization
                    </span>
                    <span className="font-bold text-slate-200">
                      {expenseRatio}% Spent
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        expenseRatio > 85
                          ? "bg-red-500"
                          : expenseRatio > 65
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${expenseRatio}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {formatPeso(totalExpense)} spent out of{" "}
                    {formatPeso(totalIncome)} inflow.
                  </p>
                </div>

                {/* 2. Top Category Concentration */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      Top Category Share
                    </span>
                    <span className="font-bold text-blue-400">
                      {topSpendShare}% of Spend
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${topSpendShare}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {topCategory
                      ? `${topCategory[0]} leads total expenses.`
                      : "No expense concentration yet."}
                  </p>
                </div>

                {/* 3. Cash Flow Health Verdict */}
                <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      Period Health Verdict
                    </span>
                    {netBalance >= 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="text-sm font-bold">
                    {netBalance >= 0 ? (
                      <span className="text-emerald-400">
                        Healthy Net Surplus (+{formatPeso(netBalance)})
                      </span>
                    ) : (
                      <span className="text-red-400">
                        Deficit Warning (-{formatPeso(Math.abs(netBalance))})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {savingsRate !== null && savingsRate >= 20
                      ? "Exceeds the recommended 20% savings benchmark."
                      : "Aim for at least a 20% monthly savings buffer."}
                  </p>
                </div>
              </div>

              {/* Embedded Interactive Summary Charts with drill-through disabled */}
              <div className="pt-2">
                <ChartsSection
                  transactions={filteredTransactions}
                  enableDrillThrough={false}
                />
              </div>
            </div>

            <AIInsightsSection />
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Financial Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed charts and spending breakdowns for {displayLabel}.
              </p>
            </div>
            <ChartsSection
              transactions={filteredTransactions}
              enableDrillThrough={true}
            />
          </div>
        )}

        {/* TAB 3: MONTHLY BUDGET */}
        {activeTab === "budgets" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <BudgetSection
              categories={categories}
              budgets={budgets || []}
              transactions={ledger}
              currentMonth={activeBudgetMonth}
            />
          </div>
        )}

        {/* TAB 4: TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            <div className="space-y-6">
              <AddTransactionSection categories={categories} today={today} />

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <h2 className="text-lg font-semibold mb-2 flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-400" />
                  <span>Import CSV Statement</span>
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Headers: `Date`, `Description`, `Amount`, `Type`.
                </p>
                <form action={importTransactionsCSV} className="space-y-4">
                  <input
                    type="file"
                    name="csvFile"
                    accept=".csv"
                    required
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  <button
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-lg text-sm font-semibold transition text-slate-200"
                  >
                    Bulk Import Transactions
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <TransactionsSection
                transactions={recentTransactions}
                categories={categories}
              />
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && <SettingsSection user={user} />}
      </main>
    </div>
  );
}
