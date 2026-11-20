// app/_components/auth-ui.tsx
"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

/* 16px text on small screens stops iOS Safari from zooming into focused inputs */
export const authInputClass =
  "w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2.5 text-base sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
export const authLabelClass = "block text-sm font-medium text-slate-300 mb-1.5";
export const authFocusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <Link
        href="/"
        className={`mb-8 flex items-center gap-3 rounded-lg ${authFocusRing}`}
      >
        <Image
          src="/finsight-logo.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain rounded-lg"
        />
        <span className="text-lg font-semibold tracking-tight text-white">
          Finsight
        </span>
      </Link>

      <main className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 mb-6 text-sm text-slate-400">{subtitle}</p>
        {children}
      </main>

      <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>
    </div>
  );
}

export function Notice({
  type,
  children,
}: {
  type: "error" | "success";
  children: ReactNode;
}) {
  const ok = type === "success";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div>{children}</div>
    </div>
  );
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={authLabelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          maxLength={72}
          autoComplete={autoComplete}
          className={`${authInputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className={`absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors ${authFocusRing}`}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
