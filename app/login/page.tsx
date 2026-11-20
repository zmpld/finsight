// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signInAccount } from "../auth/actions";
import {
  AuthShell,
  Notice,
  PasswordInput,
  authInputClass,
  authLabelClass,
  authFocusRing,
} from "../_components/auth-ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showName, setShowName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Message from the email-confirmation link, if it failed or expired
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("error") ===
      "confirm_failed"
    ) {
      setError(
        "That verification link is invalid or has expired. Sign up again to get a new one.",
      );
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      if (showName && displayName.trim())
        formData.append("display_name", displayName);

      const result = await signInAccount(formData);

      if (!result.success) {
        if (result.needsDisplayName) setShowName(true);
        setError(result.error);
        setLoading(false);
        return;
      }

      // Full navigation so the new session cookies reach the server
      window.location.href = "/dashboard";
    } catch {
      setError("We couldn’t sign you in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Access your dashboard and analytics."
      footer={
        <>
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className={`rounded font-medium text-blue-400 hover:text-blue-300 ${authFocusRing}`}
          >
            Sign up
          </Link>
        </>
      }
    >
      {error && <Notice type="error">{error}</Notice>}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="login-email" className={authLabelClass}>
            Email
          </label>
          <input
            id="login-email"
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
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {showName ? (
          <div>
            <label htmlFor="login-display-name" className={authLabelClass}>
              Display name
            </label>
            <input
              id="login-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              autoComplete="username"
              placeholder="The name of the account to open"
              className={authInputClass}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Needed only when you have several accounts with this email.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowName(true)}
            className={`rounded text-sm text-slate-400 underline underline-offset-2 hover:text-slate-200 ${authFocusRing}`}
          >
            More than one account with this email?
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60 ${authFocusRing}`}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
