// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  Sparkles,
  Upload,
  ShieldCheck,
  ArrowRight,
  Wallet,
  PiggyBank,
  CheckCircle2,
  Target,
} from "lucide-react";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";

/* Sample data for the preview. Figures are internally consistent:
   112,000 income - 27,750 expenses = 84,250 net; 27,750 / 40,000 budget = 69%. */
const SAMPLE_MONTHS = [
  { m: "Jun", income: 98, expense: 31 },
  { m: "Jul", income: 104, expense: 34 },
  { m: "Aug", income: 101, expense: 29 },
  { m: "Sep", income: 108, expense: 33 },
  { m: "Oct", income: 105, expense: 30 },
  { m: "Nov", income: 112, expense: 27.75 },
];
const SAMPLE_CATEGORIES = [
  { name: "Housing", amount: "₱9,500.00", share: 34 },
  { name: "Food", amount: "₱6,200.00", share: 22 },
  { name: "Transport", amount: "₱4,100.00", share: 15 },
  { name: "Utilities", amount: "₱3,450.00", share: 12 },
];

const FEATURES = [
  {
    icon: PieChart,
    title: "Visual analytics",
    body: "Interactive cash flow charts and category breakdowns that show where your money goes.",
  },
  {
    icon: Target,
    title: "Monthly budgets",
    body: "Set a limit per category and watch progress bars warn you before you overspend.",
  },
  {
    icon: Sparkles,
    title: "AI insights",
    body: "On request, get tailored savings suggestions based on your recent spending, powered by Google Gemini.",
  },
  {
    icon: Upload,
    title: "CSV import",
    body: "Upload a statement in bulk. Dates, descriptions, amounts and categories are checked before anything is saved.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Add your transactions",
    body: "Enter them as you spend, or import a CSV statement in seconds.",
  },
  {
    n: "2",
    title: "Set your budgets",
    body: "Choose spending limits for the categories that matter most.",
  },
  {
    n: "3",
    title: "Review and improve",
    body: "Read your charts and AI insights, then adjust next month.",
  },
];

export default function HomePage() {
  const maxValue = 120;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-lg ${focusRing}`}
          >
            <Image
              src="/finsight-logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight text-white">
              Finsight
            </span>
          </Link>

          <nav
            aria-label="Sections"
            className="hidden items-center gap-8 text-sm text-slate-400 md:flex"
          >
            <a
              href="#features"
              className="hover:text-slate-100 transition-colors"
            >
              Features
            </a>
            <a
              href="#preview"
              className="hover:text-slate-100 transition-colors"
            >
              Preview
            </a>
            <a
              href="#security"
              className="hover:text-slate-100 transition-colors"
            >
              Security
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={`rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors ${focusRing}`}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors ${focusRing}`}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              Personal finance and budgeting, with AI insights
            </p>

            <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Know where every peso goes, and{" "}
              <span className="text-blue-400">where it should go next.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Track income and expenses, import bank CSV statements, monitor
              monthly category budgets, and get clear insights from your own
              data.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors sm:w-auto ${focusRing}`}
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={`inline-flex w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-7 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors sm:w-auto ${focusRing}`}
              >
                Sign in to dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section id="preview" className="pb-24 scroll-mt-20">
          <div className="mx-auto max-w-6xl px-6">
            <figure
              aria-label="Sample dashboard preview"
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left sm:p-6"
            >
              <figcaption className="mb-5 flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <span className="text-sm font-semibold text-slate-100">
                  November 2026
                </span>
                <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                  Sample data
                </span>
              </figcaption>

              {/* KPIs */}
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Net cash flow</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-white">
                        ₱84,250.00
                      </p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                      <Wallet className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" /> +14.2% vs last month
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Income</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-400">
                        ₱112,000.00
                      </p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Salary and freelance deposits
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Expenses</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-red-400">
                        ₱27,750.00
                      </p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                      <TrendingDown className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    69% of ₱40,000 budget used
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Savings rate</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-400">
                        75%
                      </p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <PiggyBank className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Above the 20% benchmark
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Monthly bars */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 lg:col-span-3">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-100">
                      Monthly cash flow
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                        Income
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />{" "}
                        Expenses
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex h-44 items-end gap-3 border-b border-slate-800 px-1"
                    aria-hidden="true"
                  >
                    {SAMPLE_MONTHS.map((d) => (
                      <div
                        key={d.m}
                        className="flex h-full flex-1 items-end justify-center gap-1"
                      >
                        <div
                          className="w-full max-w-[22px] rounded-t bg-emerald-500"
                          style={{ height: `${(d.income / maxValue) * 100}%` }}
                        />
                        <div
                          className="w-full max-w-[22px] rounded-t bg-red-500"
                          style={{ height: `${(d.expense / maxValue) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-2 flex gap-3 px-1 text-xs text-slate-500"
                    aria-hidden="true"
                  >
                    {SAMPLE_MONTHS.map((d) => (
                      <span key={d.m} className="flex-1 text-center">
                        {d.m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Top categories */}
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 lg:col-span-2">
                  <p className="mb-4 text-sm font-semibold text-slate-100">
                    Top spending categories
                  </p>
                  <ul className="space-y-3.5">
                    {SAMPLE_CATEGORIES.map((c) => (
                      <li key={c.name} className="space-y-1.5">
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="text-slate-200">{c.name}</span>
                          <span className="tabular-nums text-slate-300">
                            {c.amount}{" "}
                            <span className="ml-1 text-slate-500">
                              {c.share}%
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${c.share}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    AI insight
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    Your dining spend dropped 18% this week. Moving ₱3,500 into
                    your emergency fund keeps your Q4 savings target on track.
                  </p>
                </div>
              </div>
            </figure>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-20 border-t border-slate-800 bg-slate-900/30 py-20"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Built for speed, clarity and control
              </h2>
              <p className="mt-3 text-base text-slate-400">
                Everything you need to organize personal cash flow without messy
                spreadsheets.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 transition-colors hover:border-slate-700"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-slate-800 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight text-white">
              How it works
            </h2>
            <ol className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-blue-400">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Security */}
        <section
          id="security"
          className="scroll-mt-20 border-t border-slate-800 py-20"
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex flex-col items-start justify-between gap-8 rounded-xl border border-slate-800 bg-slate-900/60 p-8 sm:p-10 lg:flex-row lg:items-center">
              <div className="max-w-xl space-y-4">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                  Your data stays yours
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Your financial ledger belongs strictly to you.
                </h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  Every transaction, budget and category is isolated per user at
                  the database level with PostgreSQL Row-Level Security, behind
                  authenticated sessions. AI insights only run when you ask.
                </p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-slate-300">
                  {[
                    "Per-user data isolation",
                    "Philippine peso (₱) native",
                    "Delete your data anytime",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-400" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/signup"
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors ${focusRing}`}
              >
                Start tracking now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/finsight-logo.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 rounded-md object-contain"
            />
            <span className="font-semibold text-slate-300">Finsight</span>
            <span>Personal finance and analytics</span>
          </div>
          <p>© 2026 Finsight. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
