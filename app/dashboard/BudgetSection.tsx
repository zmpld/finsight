// app/dashboard/BudgetSection.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { setBudgetLimit, deleteBudget } from "./budget-actions";
import { PiggyBank, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatMonthLabel } from "@/utils/date-format";

const inputClass =
  "w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400";

const formatPeso = (val: number | string) =>
  `₱${Number(val).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${focusRing}`}
    >
      {pending ? "Saving…" : "Save budget"}
    </button>
  );
}

type Status = "ok" | "warning" | "over";

const STATUS_STYLE: Record<
  Status,
  { bar: string; chip: string; label: string }
> = {
  ok: {
    bar: "bg-blue-500",
    chip: "bg-emerald-500/10 text-emerald-400",
    label: "On track",
  },
  warning: {
    bar: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-400",
    label: "Near limit",
  },
  over: {
    bar: "bg-red-500",
    chip: "bg-red-500/10 text-red-400",
    label: "Over budget",
  },
};

export default function BudgetSection({
  categories,
  budgets,
  transactions,
  currentMonth,
}: {
  categories: any[];
  budgets: any[];
  transactions: any[];
  currentMonth: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c: any) => c.type === "expense");
  const colorById = new Map<string, string>(
    categories.map((c: any) => [c.id, c.color || "#64748b"]),
  );

  // Spending per category for the active month
  const spendingMap: Record<string, number> = {};
  transactions
    .filter(
      (t) =>
        t.type === "expense" && t.transaction_date?.startsWith(currentMonth),
    )
    .forEach((t) => {
      if (t.category_id) {
        spendingMap[t.category_id] =
          (spendingMap[t.category_id] || 0) + Number(t.amount);
      }
    });

  // Build rows, most-used budget first
  const rows = (budgets || [])
    .map((b: any) => {
      const spent = spendingMap[b.category_id] || 0;
      const limit = Number(b.monthly_limit);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      const status: Status =
        spent >= limit ? "over" : pct >= 80 ? "warning" : "ok";
      const catRef = Array.isArray(b.categories)
        ? b.categories[0]
        : b.categories;
      return {
        id: b.id as string,
        name: (catRef?.name as string) || "Category",
        color: colorById.get(b.category_id) || "#64748b",
        spent,
        limit,
        pct,
        status,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const totalLimit = rows.reduce((acc, r) => acc + r.limit, 0);
  const totalSpent = rows.reduce((acc, r) => acc + r.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const overallStatus: Status =
    totalSpent >= totalLimit ? "over" : totalPct >= 80 ? "warning" : "ok";
  const overCount = rows.filter((r) => r.status === "over").length;

  const handleSet = async (formData: FormData) => {
    setFormError(null);
    try {
      await setBudgetLimit(formData);
    } catch (err: any) {
      setFormError(err?.message || "Could not save the budget. Try again.");
    }
  };

  const handleDelete = async (budgetId: string) => {
    setDeleteError(null);
    try {
      await deleteBudget(budgetId);
      setConfirmId(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setDeleteError(err?.message || "Could not delete the budget.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Monthly budget</h2>
        <p className="text-sm text-slate-400 mt-1">
          Spending limits for{" "}
          <span className="text-slate-200 font-medium">
            {formatMonthLabel(currentMonth)}
          </span>
        </p>
      </div>

      {/* Overall summary */}
      {rows.length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <p className="text-sm text-slate-400">Total budgeted</p>
              <p className="mt-1 text-xl font-semibold text-slate-100 tabular-nums">
                {formatPeso(totalLimit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Spent so far</p>
              <p className="mt-1 text-xl font-semibold text-slate-100 tabular-nums">
                {formatPeso(totalSpent)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">
                {totalRemaining >= 0 ? "Remaining" : "Over by"}
              </p>
              <p
                className={`mt-1 text-xl font-semibold tabular-nums ${
                  totalRemaining >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatPeso(Math.abs(totalRemaining))}
              </p>
            </div>
          </div>

          <div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${STATUS_STYLE[overallStatus].bar}`}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{Math.round(totalPct)}% of total budget used</span>
              <span className="inline-flex items-center gap-1.5">
                {overCount > 0 ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    {overCount} {overCount === 1 ? "category" : "categories"}{" "}
                    over budget
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    All categories within limit
                  </>
                )}
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Set budget form */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60">
          <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
              <PiggyBank className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Set a budget
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Saving an existing category updates its limit.
              </p>
            </div>
          </header>

          <form action={handleSet} className="p-5 space-y-5">
            <input type="hidden" name="month_year" value={currentMonth} />

            <div>
              <label htmlFor="budget-category" className={labelClass}>
                Category
              </label>
              <select
                id="budget-category"
                name="category_id"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {expenseCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="budget-limit" className={labelClass}>
                Monthly limit
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  ₱
                </span>
                <input
                  id="budget-limit"
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  name="monthly_limit"
                  placeholder="5,000.00"
                  required
                  className={`${inputClass} pl-7 tabular-nums`}
                />
              </div>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-red-400">
                {formError}
              </p>
            )}

            <SubmitButton />
          </form>
        </section>

        {/* Budget list */}
        <section className="xl:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60">
          <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Budget progress
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sorted by how much of each limit is used. The tick marks 80%.
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 tabular-nums">
              {rows.length} {rows.length === 1 ? "budget" : "budgets"}
            </span>
          </header>

          {deleteError && (
            <p role="alert" className="px-5 pt-4 text-sm text-red-400">
              {deleteError}
            </p>
          )}

          {rows.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              No budgets for {formatMonthLabel(currentMonth)} yet. Choose a
              category and a limit to set your first one.
            </div>
          ) : (
            <ul
              className={`divide-y divide-slate-800/70 transition-opacity ${isPending ? "opacity-60" : ""}`}
            >
              {rows.map((r) => {
                const style = STATUS_STYLE[r.status];
                const left = r.limit - r.spent;

                if (confirmId === r.id) {
                  return (
                    <li
                      key={r.id}
                      className="px-5 py-4 bg-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <p className="text-sm text-slate-200">
                        Delete the <span className="font-medium">{r.name}</span>{" "}
                        budget?{" "}
                        <span className="text-slate-400">
                          Your transactions stay untouched.
                        </span>
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className={`px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 transition-colors ${focusRing}`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(r.id)}
                          className={`px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${focusRing}`}
                        >
                          {isPending ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={r.id} className="group px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="text-sm font-medium text-slate-100 truncate">
                          {r.name}
                        </span>
                        <span
                          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md ${style.chip}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-sm text-slate-400 tabular-nums">
                          <span className="text-slate-100 font-medium">
                            {formatPeso(r.spent)}
                          </span>{" "}
                          / {formatPeso(r.limit)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setConfirmId(r.id);
                          }}
                          aria-label={`Delete ${r.name} budget`}
                          className={`ml-2 p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${focusRing}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div
                      className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden"
                      role="progressbar"
                      aria-label={`${r.name} budget used`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(Math.round(r.pct), 100)}
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out ${style.bar}`}
                        style={{ width: `${Math.min(r.pct, 100)}%` }}
                      />
                      <span className="absolute top-0 bottom-0 left-[80%] w-px bg-slate-950/80" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="tabular-nums">
                        {Math.round(r.pct)}% used
                      </span>
                      <span
                        className={`tabular-nums ${left < 0 ? "text-red-400" : ""}`}
                      >
                        {left >= 0
                          ? `${formatPeso(left)} left`
                          : `${formatPeso(Math.abs(left))} over`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
