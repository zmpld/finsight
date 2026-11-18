// app/dashboard/BudgetSection.tsx
"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBudgetLimit, deleteBudget } from "./budget-actions";
import { MoreVertical, Trash2 } from "lucide-react";
import { formatMonthLabel } from "@/utils/date-format";

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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate spending per category for the current month
  const spendingMap: { [categoryId: string]: number } = {};
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

  const handleDelete = async (e: React.MouseEvent, budgetId: string) => {
    e.stopPropagation(); // Prevent event bubbling
    if (
      confirm(
        "Are you sure you want to delete this budget limit? Your transaction history will remain safe.",
      )
    ) {
      try {
        setActiveMenuId(null);
        await deleteBudget(budgetId);
        startTransition(() => {
          router.refresh();
        });
      } catch (err: any) {
        alert(err.message || "Failed to delete budget");
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <h2 className="text-lg font-semibold mb-4">
        Monthly Budgets ({formatMonthLabel(currentMonth)})
      </h2>

      {/* Set Budget Form */}
      <form
        action={setBudgetLimit}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-800 items-end"
      >
        <input type="hidden" name="month_year" value={currentMonth} />
        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">
            Category
          </label>
          <select
            name="category_id"
            required
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100"
          >
            {categories
              .filter((c: any) => c.type === "expense")
              .map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase text-slate-400 mb-1">
            Monthly Limit (₱)
          </label>
          <input
            type="number"
            step="0.01"
            name="monthly_limit"
            placeholder="5000.00"
            required
            className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-sm font-semibold transition text-white"
          >
            Set / Update Budget Limit
          </button>
        </div>
      </form>

      {/* Budget Progress Bars & Alerts */}
      <div className="space-y-4">
        {budgets && budgets.length > 0 ? (
          budgets.map((b: any) => {
            const spent = spendingMap[b.category_id] || 0;
            const limit = Number(b.monthly_limit);
            const percentage =
              limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
            const isExceeded = spent >= limit;
            const isWarning = spent >= limit * 0.8 && !isExceeded;

            return (
              <div
                key={b.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 relative"
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-200">
                    {b.categories?.name || "Category"}
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400">
                      ₱{spent.toFixed(2)} / ₱{limit.toFixed(2)}
                    </span>
                    {isExceeded && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                        Exceeded 100%!
                      </span>
                    )}
                    {isWarning && (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                        Warning: 80%+
                      </span>
                    )}

                    {/* 3-Dots Menu Button */}
                    <div className="relative" ref={menuRef}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === b.id ? null : b.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        aria-label="Options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === b.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={(e) => handleDelete(e, b.id)}
                            className="w-full px-4 py-2.5 text-xs text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition font-medium disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {isPending ? "Deleting..." : "Delete Budget"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${isExceeded ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-blue-500"}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-slate-500 py-4">
            No budget limits set for this month yet.
          </p>
        )}
      </div>
    </div>
  );
}
