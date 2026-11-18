// app/page.tsx
import Link from "next/link";
import {
  TrendingUp,
  PieChart,
  Sparkles,
  Upload,
  ShieldCheck,
  ArrowRight,
  Wallet,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/finsight-logo.png"
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="font-bold text-lg text-white">Finsight</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition">
              Features
            </a>
            <a href="#preview" className="hover:text-slate-100 transition">
              Analytics
            </a>
            <a href="#security" className="hover:text-slate-100 transition">
              Security
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition shadow-lg shadow-blue-600/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/15 blur-[120px] rounded-full" />

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-blue-400 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered Personal Finance & Budgeting</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
              Master every peso with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                intelligent clarity.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Track income and expenses in real time, import bank CSV statements
              in seconds, monitor monthly category budgets, and unlock
              actionable financial insights powered by Gemini AI.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition shadow-lg shadow-blue-600/25"
              >
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-semibold text-slate-200 transition"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Dashboard Mockup Preview */}
            <div
              id="preview"
              className="mt-16 max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-slate-500">
                    finsight.app/dashboard
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Live Sync Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Net Balance
                  </p>
                  <p className="text-2xl font-bold text-white mt-1.5">
                    ₱84,250.00
                  </p>
                  <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> +14.2% from last
                    month
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-emerald-400">
                    Monthly Income
                  </p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1.5">
                    ₱112,000.00
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Salary & Freelance Deposits
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-red-400">
                    Monthly Expenses
                  </p>
                  <p className="text-2xl font-bold text-red-400 mt-1.5">
                    ₱27,750.00
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    68% of ₱40,000 budget used
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Gemini AI Financial Insight
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    Your dining expenses decreased by 18% this week.
                    Reallocating ₱3,500 to your Emergency Fund keeps you on
                    track to hit your Q4 savings target ahead of schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-20 border-t border-slate-800/80 bg-slate-900/30"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Built for speed, clarity, and control
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-400">
                Everything you need to organize personal cash flow without
                bloated spreadsheets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition">
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                  <PieChart className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  Visual Analytics
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Interactive cash flow charts and category breakdowns that
                  instantly show where your money goes.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  Smart Monthly Budgets
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Set spending caps per category and monitor real-time progress
                  bars before you overspend.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition">
                <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  AI Financial Advisor
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Analyze spending habits and receive tailored savings
                  recommendations powered by Google Gemini.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  One-Click CSV Import
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Upload bank statements in bulk with automatic parsing for
                  dates, descriptions, and amounts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Trust Banner */}
        <section id="security" className="py-20 border-t border-slate-800/80">
          <div className="max-w-5xl mx-auto px-6">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Row-Level Security Enforced</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Your financial ledger belongs strictly to you.
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Every transaction, budget, and category is isolated at the
                  database layer using PostgreSQL Row-Level Security policies
                  and encrypted session authentication.
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    Strict User Data Isolation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    Philippine Peso (₱) Native
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    Instant Cloud Sync
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition shadow-lg shadow-blue-600/20"
                >
                  <span>Start Tracking Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <img
              src="/finsight-logo.png"
              alt="Finsight Logo"
              className="h-6 w-6 object-contain"
            />
            <span className="font-semibold text-slate-300">Finsight</span>
            <span>— Personal Finance & Analytics</span>
          </div>
          <div className="flex items-center space-x-6">
            © 2026 Finsight. All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
