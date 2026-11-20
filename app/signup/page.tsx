// app/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signUpAccount } from "../auth/actions";
import Link from "next/link";
import { ShieldCheck, FileText, X } from "lucide-react";
import {
  AuthShell,
  Notice,
  PasswordInput,
  authInputClass,
  authLabelClass,
  authFocusRing,
} from "../_components/auth-ui";

type LegalKey = "privacy" | "terms";

const LEGAL: Record<
  LegalKey,
  {
    title: string;
    icon: typeof ShieldCheck;
    sections: { heading: string; body: string }[];
  }
> = {
  privacy: {
    title: "Privacy Policy",
    icon: ShieldCheck,
    sections: [
      {
        heading: "1. Data minimization and what we store",
        body: "Finsight collects only the information necessary to provide personal finance tracking: your email address, display name, and the financial records you manually enter or upload via CSV (transaction descriptions, amounts, categories, dates, and monthly budgets). We never ask for or store bank passwords, account numbers, or government IDs.",
      },
      {
        heading: "2. Authentication and data isolation",
        body: "User authentication is managed securely via Supabase Auth with encrypted passwords and session cookies. All financial data is stored in PostgreSQL protected by Row-Level Security (RLS) so only your authenticated account can read or modify your records.",
      },
      {
        heading: "3. On-demand AI processing",
        body: "AI Financial Insights run strictly on demand when you click “Generate insights” or “Refresh insights.” Your recent transaction summaries (dates, types, amounts, categories, and descriptions) are sent securely to Google’s Gemini API solely to generate personalized budgeting recommendations.",
      },
      {
        heading: "4. Your control, data retention and deletion",
        body: "You maintain full ownership of your financial ledger. You may edit or delete individual transactions anytime, or permanently delete your account and data from the Settings tab.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    icon: FileText,
    sections: [
      {
        heading: "1. Acceptance of terms",
        body: "By creating an account and using Finsight, you agree to comply with these Terms of Use and our Privacy Policy. You are responsible for maintaining the confidentiality of your login credentials.",
      },
      {
        heading: "2. Informational purpose only (no financial advice)",
        body: "Finsight is a personal expense-tracking and visualization tool. Charts, analytics, and AI-generated insights are provided for informational and educational purposes only and do not constitute certified financial, tax, or investment advice.",
      },
      {
        heading: "3. Responsible use and data uploads",
        body: "You agree not to upload malicious files, falsified CSV payloads, or sensitive third-party banking credentials, and not to abuse or automate requests against our AI insight or authentication endpoints.",
      },
      {
        heading: "4. Account termination",
        body: "You may discontinue using Finsight and delete your account records at any time through Settings. We reserve the right to suspend accounts that violate security policies or abuse platform resources.",
      },
    ],
  },
};

const MIN_PASSWORD_LENGTH = 8;

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [activeLegal, setActiveLegal] = useState<LegalKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeLegal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveLegal(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeLegal]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setSuccessMessage(null);

    if (!agreedToPolicies) {
      setError(
        "You must agree to the Privacy Policy and Terms of Use to create an account.",
      );
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`,
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("agreed", String(agreedToPolicies));

      const result = await signUpAccount(formData);
      setLoading(false);

      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccessMessage(
        result.message ?? "Check your inbox for a verification link.",
      );
    } catch {
      setError("We couldn’t create your account. Please try again.");
      setLoading(false);
    }
  };

  const legal = activeLegal ? LEGAL[activeLegal] : null;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking your finances with Finsight."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className={`text-blue-400 hover:text-blue-300 font-medium rounded ${authFocusRing}`}
          >
            Sign in
          </Link>
        </>
      }
    >
      {error && <Notice type="error">{error}</Notice>}
      {successMessage && <Notice type="success">{successMessage}</Notice>}

      {!successMessage ? (
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label htmlFor="signup-name" className={authLabelClass}>
              Display name
            </label>
            <input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={80}
              autoComplete="name"
              placeholder="Clark Kent"
              className={authInputClass}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              You can open more than one account with the same email, as long as
              each has its own display name.
            </p>
          </div>

          <div>
            <label htmlFor="signup-email" className={authLabelClass}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              className={authInputClass}
            />
          </div>

          <PasswordInput
            id="signup-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          />

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToPolicies}
              onChange={(e) => setAgreedToPolicies(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 accent-blue-600"
            />
            <span className="text-sm leading-relaxed text-slate-400">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setActiveLegal("terms")}
                className={`text-blue-400 hover:text-blue-300 underline underline-offset-2 rounded ${authFocusRing}`}
              >
                Terms of Use
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setActiveLegal("privacy")}
                className={`text-blue-400 hover:text-blue-300 underline underline-offset-2 rounded ${authFocusRing}`}
              >
                Privacy Policy
              </button>
              , including how my transaction data is stored and processed for AI
              insights.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !agreedToPolicies}
            className={`w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${authFocusRing}`}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className={`inline-flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors ${authFocusRing}`}
        >
          Go to sign in
        </Link>
      )}

      {/* Legal dialog */}
      {legal && activeLegal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setActiveLegal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                  <legal.icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <h2
                    id="legal-title"
                    className="text-sm font-semibold text-white"
                  >
                    {legal.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Effective November 2026 · Version 1.0
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegal(null)}
                aria-label="Close"
                autoFocus
                className={`rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${authFocusRing}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5">
              {legal.sections.map((s) => (
                <section key={s.heading}>
                  <h3 className="mb-1 text-sm font-semibold text-slate-100">
                    {s.heading}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {s.body}
                  </p>
                </section>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setActiveLegal(
                    activeLegal === "privacy" ? "terms" : "privacy",
                  )
                }
                className={`rounded text-sm text-slate-400 hover:text-white transition-colors ${authFocusRing}`}
              >
                View{" "}
                {activeLegal === "privacy" ? "Terms of Use" : "Privacy Policy"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreedToPolicies(true);
                  setActiveLegal(null);
                }}
                className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors ${authFocusRing}`}
              >
                I understand and agree
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
