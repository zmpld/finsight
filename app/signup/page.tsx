// app/signup/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  FileText,
  X,
} from "lucide-react";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<
    "privacy" | "terms" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!agreedToPolicies) {
      setError(
        "You must agree to the Privacy Policy and Terms of Use to create an account.",
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            accepted_terms_at: new Date().toISOString(),
            policy_version: "1.0",
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccessMessage(
        "We've sent a verification link to your email. Please check your inbox to continue.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 border border-slate-800 shadow-xl">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Create an Account
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Start tracking your finances with Finsight today.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-300 leading-relaxed">
              {successMessage}
            </p>
          </div>
        )}

        {!successMessage ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={80}
                autoComplete="name"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                placeholder="Clark Kent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 pr-10 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Privacy Policy & Terms of Use Consent */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToPolicies}
                  onChange={(e) => setAgreedToPolicies(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  I agree to Finsight&apos;s{" "}
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal("terms")}
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Terms of Use
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal("privacy")}
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Privacy Policy
                  </button>
                  , including how my transaction data is stored and processed
                  for AI insights.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedToPolicies}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 py-2.5 text-sm font-semibold text-white transition"
            >
              Proceed to Sign In
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Legal Policy Modal */}
      {activeLegalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setActiveLegalModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  {activeLegalModal === "privacy" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {activeLegalModal === "privacy"
                      ? "Privacy Policy"
                      : "Terms of Use"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Effective Date: November 2026 · Version 1.0
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
              {activeLegalModal === "privacy" ? (
                <>
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      1. Data Minimization &amp; What We Store
                    </h3>
                    <p className="text-slate-400">
                      Finsight collects only the information necessary to
                      provide personal finance tracking: your email address,
                      display name, and the financial records you manually enter
                      or upload via CSV (transaction descriptions, amounts,
                      categories, dates, and monthly budgets). We never ask for
                      or store bank passwords, account numbers, or government
                      IDs.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      2. Authentication &amp; Data Isolation
                    </h3>
                    <p className="text-slate-400">
                      User authentication is managed securely via Supabase Auth
                      with encrypted passwords and session cookies. All
                      financial data is stored in PostgreSQL protected by
                      Row-Level Security (RLS) so only your authenticated
                      account can read or modify your records.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      3. On-Demand AI Processing
                    </h3>
                    <p className="text-slate-400">
                      AI Financial Insights run strictly on-demand when you
                      click &ldquo;Generate Insights&rdquo; or &ldquo;Refresh
                      Insights.&rdquo; Your recent transaction summaries (dates,
                      types, amounts, categories, and descriptions) are sent
                      securely to Google&apos;s Gemini API solely to generate
                      personalized budgeting recommendations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      4. Your Control, Data Retention &amp; Deletion
                    </h3>
                    <p className="text-slate-400">
                      You maintain full ownership of your financial ledger. You
                      may edit or delete individual transactions anytime, or
                      permanently wipe your account data from the Account
                      Settings tab.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      1. Acceptance of Terms
                    </h3>
                    <p className="text-slate-400">
                      By creating an account and using Finsight, you agree to
                      comply with these Terms of Use and our Privacy Policy. You
                      are responsible for maintaining the confidentiality of
                      your login credentials.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      2. Informational Purpose Only (No Financial Advice)
                    </h3>
                    <p className="text-slate-400">
                      Finsight is a personal expense-tracking and visualization
                      tool. Charts, analytics, and AI-generated insights are
                      provided for informational and educational purposes only
                      and do not constitute certified financial, tax, or
                      investment advice.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      3. Responsible Use &amp; Data Uploads
                    </h3>
                    <p className="text-slate-400">
                      You agree not to upload malicious files, falsified CSV
                      payloads, or sensitive third-party banking credentials,
                      and not to abuse or automate requests against our AI
                      insight or authentication endpoints.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      4. Account Termination
                    </h3>
                    <p className="text-slate-400">
                      You may discontinue using Finsight and delete your account
                      records at any time through Account Settings. We reserve
                      the right to suspend accounts that violate security
                      policies or abuse platform resources.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveLegalModal(
                      activeLegalModal === "privacy" ? "terms" : "privacy",
                    )
                  }
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  View{" "}
                  {activeLegalModal === "privacy"
                    ? "Terms of Use"
                    : "Privacy Policy"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAgreedToPolicies(true);
                  setActiveLegalModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition"
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
