// app/dashboard/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import dynamic from "next/dynamic";
import { logout } from "./actions";
import { importTransactionsCSV } from "./csv-actions";
import BudgetSection from "./BudgetSection";
import AIInsightsSection from "./AIInsightsSection";
import TransactionsSection from "./TransactionsSection";
import TimeframeFilter from "./TimeframeFilter";
import AddTransactionSection from "./AddTransactionSection";
import DashboardSidebar from "./DashboardSidebar";
import { formatMonthLabel } from "@/utils/date-format";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Upload,
  LogOut,
  PiggyBank,
  CalendarDays,
  Shield,
  UserCheck,
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
          "id, type, amount, description, transaction_date, category_id, categories(name, color)",
        )
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                    Period Net Cash Flow
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    ₱{netBalance.toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-400 font-medium">
                    Period Income
                  </p>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">
                    ₱{totalIncome.toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-red-400 font-medium">
                    Period Expenses
                  </p>
                  <p className="text-3xl font-bold text-red-400 mt-2">
                    ₱{totalExpense.toFixed(2)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-400 font-semibold mb-4">
                <CalendarDays className="h-4 w-4" />
                Active Range Summary · {displayLabel}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      ? `${topCategory[0]} (₱${topCategory[1].toFixed(0)})`
                      : "None"}
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <PiggyBank className="h-5 w-5" />
                  </div>
                </div>
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
            <ChartsSection transactions={filteredTransactions} />
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
        {activeTab === "settings" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-2xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Account Settings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your profile credentials and security preferences.
              </p>
            </div>
            <div className="border-t border-slate-800 pt-4 space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1 font-medium">
                  User ID
                </label>
                <input
                  type="text"
                  disabled
                  value={user.id}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-400 cursor-not-allowed font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
