"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Trash2, X, Check, Search } from "lucide-react";
import { deleteTransaction, updateTransaction } from "./actions";

type Category = {
  id: string;
  name: string;
  type: string;
};

type CategoryRef = { name?: string; color?: string };

type Transaction = {
  id: string;
  type: "income" | "expense" | string;
  amount: number | string;
  description: string;
  transaction_date: string;
  category_id: string | null;
  categories?: CategoryRef | CategoryRef[] | null;
};

function categoryName(
  categories: Transaction["categories"],
): string | undefined {
  if (!categories) return undefined;
  if (Array.isArray(categories)) return categories[0]?.name;
  return categories.name;
}

const fieldClass =
  "w-full min-w-0 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:outline-none";

export default function TransactionsSection({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (!q) return true;
      const cat = categoryName(t.categories) || "";
      return (
        t.description.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );
    });
  }, [transactions, query, typeFilter]);

  const handleDelete = (id: string, description: string) => {
    if (!confirm(`Delete “${description}”? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        await deleteTransaction(formData);
        if (editingId === id) setEditingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  };

  const handleUpdate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateTransaction(formData);
        setEditingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, edit, or delete entries without leaving the dashboard.
          </p>
        </div>
        <span className="self-start sm:self-auto shrink-0 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-400">
          {filtered.length} shown
        </span>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <div className="relative w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search description or category…"
            className={`${fieldClass} pl-9`}
          />
        </div>
        <div className="grid grid-cols-3 rounded-lg border border-slate-800 overflow-hidden text-sm">
          {(["all", "income", "expense"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
              className={`px-3 py-2 capitalize transition ${
                typeFilter === value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((t) =>
            editingId === t.id ? (
              <form
                key={t.id}
                action={handleUpdate}
                className="rounded-xl border border-blue-500/30 bg-slate-950/80 p-4 space-y-3"
              >
                <input type="hidden" name="id" value={t.id} />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Editing transaction
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-800 px-3 text-sm font-medium text-slate-200 hover:bg-slate-700"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Description
                    </label>
                    <input
                      name="description"
                      defaultValue={t.description}
                      required
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Type
                    </label>
                    <select
                      name="type"
                      defaultValue={t.type}
                      className={fieldClass}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Amount (₱)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      defaultValue={Number(t.amount)}
                      required
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Category
                    </label>
                    <select
                      name="category_id"
                      defaultValue={t.category_id || ""}
                      className={fieldClass}
                    >
                      <option value="">Unassigned</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="transaction_date"
                      defaultValue={t.transaction_date}
                      required
                      className={fieldClass}
                    />
                  </div>
                </div>
              </form>
            ) : (
              <div
                key={t.id}
                className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3 sm:px-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-100 truncate">
                          {t.description}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 truncate">
                          {categoryName(t.categories) || "Unassigned"}
                          <span className="text-slate-600"> · </span>
                          {t.transaction_date}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          t.type === "income"
                            ? "text-emerald-400"
                            : "text-slate-100"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}₱
                        {Number(t.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(t.id)}
                      disabled={isPending}
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition disabled:opacity-50"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4 mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id, t.description)}
                      disabled={isPending}
                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            ),
          )
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
            {transactions.length === 0
              ? "No transactions yet — add one or import a CSV."
              : "No transactions match your filters."}
          </div>
        )}
      </div>
    </div>
  );
}
