// app/dashboard/page.tsx
import { Suspense } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import dynamic from "next/dynamic";
import ImportCsvForm from "./ImportCsvForm";
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
  PiggyBank,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  ListOrdered,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Design tokens: one surface, one border, one accent, three semantics */
/* ------------------------------------------------------------------ */
const TONES = {
  neutral: {
    text: "text-slate-100",
    chip: "bg-slate-800 text-slate-300",
    bar: "bg-slate-500",
  },
  accent: {
    text: "text-blue-400",
    chip: "bg-blue-500/10 text-blue-400",
    bar: "bg-blue-500",
  },
  positive: {
    text: "text-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-400",
    bar: "bg-emerald-500",
  },
  warning: {
    text: "text-amber-400",
    chip: "bg-amber-500/10 text-amber-400",
    bar: "bg-amber-500",
  },
  negative: {
    text: "text-red-400",
    chip: "bg-red-500/10 text-red-400",
    bar: "bg-red-500",
  },
} as const;
type Tone = keyof typeof TONES;

const ChartsSection = dynamic(() => import("./ChartsSection"), {
  loading: () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="h-80 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse" />
      <div className="h-80 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse" />
    </div>
  ),
});

/* ----------------------------- UI primitives ----------------------------- */
function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-slate-900/60 ${className}`}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  description,
  right,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-800">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          {description && (
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {right}
    </header>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  footer,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  footer: ReactNode;
}) {
  return (
    <Panel className="p-5 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">{label}</p>
          <p
            className={`mt-1.5 text-2xl xl:text-[1.75rem] font-semibold tracking-tight tabular-nums truncate ${TONES[tone].text}`}
          >
            {value}
          </p>
        </div>
        <div
          className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${TONES[tone].chip}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 min-h-[1.75rem] flex items-center">
        {footer}
      </div>
    </Panel>
  );
}

function Meter({
  label,
  readout,
  pct,
  tone,
  caption,
}: {
  label: string;
  readout: string;
  pct: number;
  tone: Tone;
  caption: string;
}) {
  const safe = Math.max(0, Math.min(100, pct));
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={`font-semibold tabular-nums ${TONES[tone].text}`}>
          {readout}
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${TONES[tone].bar}`}
          style={{ width: `${safe}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{caption}</p>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <div className="hidden lg:block w-64 bg-slate-900 border-r border-slate-800 animate-pulse" />
      <div className="flex-1 p-6 lg:p-10 space-y-6 animate-pulse">
        <div className="h-14 rounded-xl bg-slate-900/60 border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-slate-900/60 border border-slate-800"
            />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-slate-900/60 border border-slate-800" />
      </div>
    </div>
  );
}

type SearchParams = Promise<{
  period?: string;
  start?: string;
  end?: string;
  tab?: string;
}>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
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
  searchParams: SearchParams;
}) {
  await connection();
  const resolvedSearchParams = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const formatPeso = (val: number | string, decimals = 2) =>
    `₱${Number(val).toLocaleString("en-PH", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;

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
    if (!categoryMap.has(uniqueKey)) categoryMap.set(uniqueKey, cat);
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
      displayLabel = "All-time history";
      return true;
    }
    const targetPeriod = periodParam || currentMonth;
    displayLabel = formatMonthLabel(targetPeriod);
    return txMonth === targetPeriod;
  });

  const recentTransactions = filteredTransactions;

  const sumBy = (list: typeof ledger, type: string) =>
    list
      .filter((t) => t.type === type)
      .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalIncome = sumBy(filteredTransactions, "income");
  const totalExpense = sumBy(filteredTransactions, "expense");
  const netBalance = totalIncome - totalExpense;

  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : null;

  const categoryLabel = (
    ref: { name?: string } | { name?: string }[] | null | undefined,
  ) => {
    if (!ref) return "Unassigned";
    if (Array.isArray(ref)) return ref[0]?.name || "Unassigned";
    return ref.name || "Unassigned";
  };

  // Expense totals per category, sorted descending
  const expenseByCategory = (() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const name = categoryLabel(t.categories);
        map[name] = (map[name] || 0) + Number(t.amount);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  })();
  const topCategory = expenseByCategory[0] || null;
  const topFive = expenseByCategory.slice(0, 5);

  const incomeSourcesLabel = (() => {
    const sources = Array.from(
      new Set(
        filteredTransactions
          .filter((t) => t.type === "income")
          .map((t) => categoryLabel(t.categories)),
      ),
    );
    if (sources.length === 0) return "No deposits recorded this period";
    if (sources.length === 1) return `${sources[0]} deposits`;
    return `${sources.slice(0, 2).join(" & ")} deposits`;
  })();

  // Month-over-month net cash flow
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

    const prevNet = sumBy(prevTxs, "income") - sumBy(prevTxs, "expense");
    if (prevNet === 0) return null;
    return Number(
      (((netBalance - prevNet) / Math.abs(prevNet)) * 100).toFixed(1),
    );
  })();

  const totalBudgetLimit = (budgets || []).reduce(
    (acc, b) => acc + Number(b.monthly_limit || 0),
    0,
  );
  const budgetUsedPct =
    totalBudgetLimit > 0
      ? Math.round((totalExpense / totalBudgetLimit) * 100)
      : null;

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

  const expenseCount = filteredTransactions.filter(
    (t) => t.type === "expense",
  ).length;

  const ratioTone: Tone =
    expenseRatio > 85 ? "negative" : expenseRatio > 65 ? "warning" : "positive";
  const budgetTone: Tone =
    budgetUsedPct === null
      ? "neutral"
      : budgetUsedPct > 100
        ? "negative"
        : budgetUsedPct > 80
          ? "warning"
          : "positive";
  const savingsTone: Tone =
    savingsRate === null
      ? "neutral"
      : savingsRate >= 20
        ? "positive"
        : savingsRate >= 0
          ? "warning"
          : "negative";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1440px] p-5 sm:p-8 lg:p-10 space-y-8">
          {/* Page header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-6 border-b border-slate-800">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Showing data for{" "}
                <span className="text-slate-200 font-medium">
                  {displayLabel}
                </span>
              </p>
            </div>
            <TimeframeFilter currentMonth={currentMonth} />
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <KpiCard
                  label="Net cash flow"
                  icon={Wallet}
                  tone={netBalance < 0 ? "negative" : "neutral"}
                  value={
                    netBalance < 0
                      ? `-${formatPeso(Math.abs(netBalance))}`
                      : formatPeso(netBalance)
                  }
                  footer={
                    momChange !== null ? (
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          momChange >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {momChange >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {momChange >= 0 ? "+" : ""}
                        {momChange}% vs last month
                      </span>
                    ) : (
                      <span>
                        {netBalance >= 0
                          ? "Positive net cash position"
                          : "Net cash deficit in period"}
                      </span>
                    )
                  }
                />
                <KpiCard
                  label="Income"
                  icon={TrendingUp}
                  tone="positive"
                  value={formatPeso(totalIncome)}
                  footer={
                    <span className="truncate">{incomeSourcesLabel}</span>
                  }
                />
                <KpiCard
                  label="Expenses"
                  icon={TrendingDown}
                  tone="negative"
                  value={formatPeso(totalExpense)}
                  footer={
                    budgetUsedPct !== null ? (
                      <span className={`font-medium ${TONES[budgetTone].text}`}>
                        {budgetUsedPct}% of {formatPeso(totalBudgetLimit, 0)}{" "}
                        budget used
                      </span>
                    ) : (
                      <span>{expenseCount} expense transactions logged</span>
                    )
                  }
                />
                <KpiCard
                  label="Savings rate"
                  icon={PiggyBank}
                  tone={savingsTone}
                  value={savingsRate === null ? "—" : `${savingsRate}%`}
                  footer={
                    <span>
                      {savingsRate === null
                        ? "Add income to calculate"
                        : savingsRate >= 20
                          ? "Above the 20% benchmark"
                          : "Below the 20% benchmark"}
                    </span>
                  }
                />
              </div>

              {/* Analysis row: health meters + top categories */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <Panel className="xl:col-span-3">
                  <PanelHeader
                    icon={Gauge}
                    title="Financial health"
                    description={`Spending efficiency for ${displayLabel}`}
                    right={
                      <span className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                        <Activity className="h-3.5 w-3.5 text-slate-400" />
                        {filteredTransactions.length} transactions
                      </span>
                    }
                  />
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <Meter
                      label="Income spent"
                      readout={`${expenseRatio}%`}
                      pct={expenseRatio}
                      tone={ratioTone}
                      caption={`${formatPeso(totalExpense)} of ${formatPeso(totalIncome)} inflow`}
                    />
                    <Meter
                      label="Budget used"
                      readout={
                        budgetUsedPct === null ? "Not set" : `${budgetUsedPct}%`
                      }
                      pct={budgetUsedPct ?? 0}
                      tone={budgetTone}
                      caption={
                        budgetUsedPct === null
                          ? "Set a monthly budget to track this"
                          : `${formatPeso(totalExpense)} of ${formatPeso(totalBudgetLimit)}`
                      }
                    />
                    <Meter
                      label="Top category share"
                      readout={`${topSpendShare}%`}
                      pct={topSpendShare}
                      tone="accent"
                      caption={
                        topCategory
                          ? `${topCategory[0]} leads total expenses`
                          : "No expense concentration yet"
                      }
                    />
                    <div
                      className={`rounded-lg border p-4 flex gap-3 items-start ${
                        netBalance >= 0
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-red-500/20 bg-red-500/5"
                      }`}
                    >
                      {netBalance >= 0 ? (
                        <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-red-400" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {netBalance >= 0
                            ? `Net surplus of ${formatPeso(netBalance)}`
                            : `Deficit of ${formatPeso(Math.abs(netBalance))}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {savingsRate !== null && savingsRate >= 20
                            ? "You are saving more than the recommended 20%."
                            : "Aim to save at least 20% of income each month."}
                        </p>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel className="xl:col-span-2">
                  <PanelHeader
                    icon={ListOrdered}
                    title="Top spending categories"
                    description="Share of total expenses"
                  />
                  <div className="p-5">
                    {topFive.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No expenses in this period. Add a transaction to see
                        where your money goes.
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {topFive.map(([name, amount]) => {
                          const share =
                            totalExpense > 0
                              ? Math.round((amount / totalExpense) * 100)
                              : 0;
                          return (
                            <li key={name} className="space-y-1.5">
                              <div className="flex items-baseline justify-between gap-3 text-sm">
                                <span className="text-slate-200 truncate">
                                  {name}
                                </span>
                                <span className="text-slate-300 tabular-nums shrink-0">
                                  {formatPeso(amount)}
                                  <span className="text-slate-500 ml-2">
                                    {share}%
                                  </span>
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-500 transition-[width] duration-700 ease-out"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </Panel>
              </div>

              {/* Charts */}
              <Panel>
                <PanelHeader
                  icon={BarChart3}
                  title="Charts and report analysis"
                  description={`Cash flow and spending concentration for ${displayLabel}`}
                />
                <div className="p-5">
                  <ChartsSection
                    transactions={filteredTransactions}
                    enableDrillThrough={false}
                  />
                </div>
              </Panel>

              <AIInsightsSection />
            </div>
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Financial analytics
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Detailed charts and spending breakdowns for {displayLabel}.
                </p>
              </div>
              <ChartsSection
                transactions={filteredTransactions}
                enableDrillThrough={true}
              />
            </div>
          )}

          {/* TAB: MONTHLY BUDGET */}
          {activeTab === "budgets" && (
            <div className="space-y-6">
              <BudgetSection
                categories={categories}
                budgets={budgets || []}
                transactions={ledger}
                currentMonth={activeBudgetMonth}
              />
            </div>
          )}

          {/* TAB: TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="space-y-6">
                <AddTransactionSection categories={categories} today={today} />
                <ImportCsvForm />
              </div>

              <div className="lg:col-span-2">
                <TransactionsSection
                  transactions={recentTransactions}
                  categories={categories}
                />
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && <SettingsSection user={user} />}
        </div>
      </main>
    </div>
  );
}
