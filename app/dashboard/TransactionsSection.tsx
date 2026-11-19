// app/dashboard/TransactionsSection.tsx
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteTransaction, updateTransaction } from "./actions";
import {
  Pencil,
  Trash2,
  Check,
  ArrowUpDown,
  Search,
  ChevronDown,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  description: string;
  transaction_date: string;
  created_at?: string;
  category_id?: string;
  categories?:
    | { name?: string; color?: string }
    | { name?: string; color?: string }[];
}

type SortKey =
  | "newest"
  | "oldest"
  | "largest"
  | "smallest"
  | "date_asc"
  | "date_desc";

const SORT_GROUPS: { id: SortKey; label: string }[][] = [
  [
    { id: "newest", label: "Recently added" },
    { id: "oldest", label: "Earliest added" },
  ],
  [
    { id: "largest", label: "Largest first" },
    { id: "smallest", label: "Smallest first" },
  ],
  [
    { id: "date_desc", label: "Date, newest first" },
    { id: "date_asc", label: "Date, oldest first" },
  ],
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expenses" },
] as const;

const inputClass =
  "w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
const labelClass = "block text-xs font-medium text-slate-400 mb-1.5";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400";

const formatPeso = (val: number | string) =>
  `₱${Number(val).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d: string) => {
  if (!d) return "—";
  const date = new Date(`${d}T00:00:00`);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getCategory = (catRef: Transaction["categories"]) => {
  const c = Array.isArray(catRef) ? catRef[0] : catRef;
  return { name: c?.name || "Unassigned", color: c?.color || "#64748b" };
};

export default function TransactionsSection({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Editing + delete-confirm state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCatId, setEditCatId] = useState("");
  const [editDate, setEditDate] = useState("");

  // Close the sort menu on outside click or Escape
  useEffect(() => {
    if (!isSortOpen) return;
    const onDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSortOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isSortOpen]);

  const handleStartEdit = (t: Transaction) => {
    setConfirmDeleteId(null);
    setEditingId(t.id);
    setEditDesc(t.description);
    setEditAmount(String(t.amount));
    setEditType(t.type as "income" | "expense");
    setEditCatId(t.category_id || "");
    setEditDate(t.transaction_date || "");
  };

  const handleSaveEdit = async (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("description", editDesc);
    formData.append("amount", editAmount);
    formData.append("type", editType);
    formData.append("category_id", editCatId);
    formData.append("transaction_date", editDate);

    await updateTransaction(formData);
    setEditingId(null);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleDelete = async (id: string) => {
    const formData = new FormData();
    formData.append("id", id);

    await deleteTransaction(formData);
    setConfirmDeleteId(null);
    startTransition(() => {
      router.refresh();
    });
  };

  // 1. Filter by type and search query
  const query = searchQuery.trim().toLowerCase();
  const filtered = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;
    const catName = getCategory(t.categories).name.toLowerCase();
    const matchesSearch =
      !query ||
      t.description.toLowerCase().includes(query) ||
      catName.includes(query);
    return matchesType && matchesSearch;
  });

  // 2. Sort (signed amounts: income positive, expense negative)
  const sortedTransactions = [...filtered].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

    if (sortBy === "newest") return timeB - timeA;
    if (sortBy === "oldest") return timeA - timeB;

    if (sortBy === "date_asc" || sortBy === "date_desc") {
      const dA = new Date(a.transaction_date || 0).getTime();
      const dB = new Date(b.transaction_date || 0).getTime();
      return sortBy === "date_asc" ? dA - dB : dB - dA;
    }

    const valA = a.type === "income" ? Number(a.amount) : -Number(a.amount);
    const valB = b.type === "income" ? Number(b.amount) : -Number(b.amount);
    return sortBy === "largest" ? valB - valA : valA - valB;
  });

  const shownNet = sortedTransactions.reduce(
    (acc, t) => acc + (t.type === "income" ? 1 : -1) * Number(t.amount),
    0,
  );

  const activeSortLabel =
    SORT_GROUPS.flat().find((o) => o.id === sortBy)?.label ?? "Sort";

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60">
      {/* Header */}
      <header className="px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Transactions</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, edit or delete entries for the selected period.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 tabular-nums">
          {sortedTransactions.length} of {transactions.length}
        </span>
      </header>

      {/* Toolbar */}
      <div className="px-5 py-4 space-y-3 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="search"
              aria-label="Search transactions"
              placeholder="Search description or category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClass} !bg-slate-950 pl-9`}
            />
          </div>

          {/* Sort menu */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isSortOpen}
              onClick={() => setIsSortOpen((o) => !o)}
              className={`w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-sm text-slate-300 transition-colors ${focusRing}`}
            >
              <span className="inline-flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-slate-500" />
                {activeSortLabel}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isSortOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-950 border border-slate-700 shadow-xl py-1 z-30"
              >
                {SORT_GROUPS.map((group, gi) => (
                  <div
                    key={gi}
                    className={
                      gi > 0 ? "border-t border-slate-800 mt-1 pt-1" : ""
                    }
                  >
                    {group.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={sortBy === opt.id}
                        onClick={() => {
                          setSortBy(opt.id);
                          setIsSortOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/70 transition-colors"
                      >
                        {opt.label}
                        {sortBy === opt.id && (
                          <Check className="h-4 w-4 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Type filter */}
        <div
          role="tablist"
          aria-label="Filter by type"
          className="inline-flex p-1 rounded-lg bg-slate-950 border border-slate-800"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filterType === f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${focusRing} ${
                filterType === f.id
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column headings (desktop) */}
      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_6.5rem_9rem_5rem] gap-x-4 px-5 py-2 text-xs font-medium text-slate-500 border-b border-slate-800">
        <span>Description</span>
        <span>Date</span>
        <span className="text-right">Amount</span>
        <span className="sr-only">Actions</span>
      </div>

      {/* Rows */}
      {sortedTransactions.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-slate-500">
          {transactions.length === 0
            ? "No transactions in this period. Add one with the form to get started."
            : "No transactions match your search or filter."}
        </div>
      ) : (
        <ul
          className={`divide-y divide-slate-800/70 transition-opacity ${isPending ? "opacity-60" : ""}`}
        >
          {sortedTransactions.map((t) => {
            const isIncome = t.type === "income";
            const cat = getCategory(t.categories);

            /* ---- Edit mode ---- */
            if (editingId === t.id) {
              return (
                <li key={t.id} className="px-5 py-4 bg-slate-950/60">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Description</label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Amount (₱)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Type</label>
                        <select
                          value={editType}
                          onChange={(e) => {
                            setEditType(e.target.value as "income" | "expense");
                            setEditCatId("");
                          }}
                          className={inputClass}
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Category</label>
                        <select
                          value={editCatId}
                          onChange={(e) => setEditCatId(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Unassigned</option>
                          {categories
                            .filter((c) => c.type === editType)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className={`${inputClass} [&::-webkit-calendar-picker-indicator]:invert`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={`px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 transition-colors ${focusRing}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSaveEdit(t.id)}
                        className={`px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${focusRing}`}
                      >
                        {isPending ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            }

            /* ---- Delete confirmation ---- */
            if (confirmDeleteId === t.id) {
              return (
                <li
                  key={t.id}
                  className="px-5 py-3.5 bg-red-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <p className="text-sm text-slate-200 min-w-0">
                    Delete{" "}
                    <span className="font-medium truncate">
                      “{t.description}”
                    </span>
                    ?{" "}
                    <span className="text-slate-400">
                      This can’t be undone.
                    </span>
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className={`px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-200 transition-colors ${focusRing}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(t.id)}
                      className={`px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${focusRing}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            }

            /* ---- Default row ---- */
            return (
              <li
                key={t.id}
                className="group grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[minmax(0,1fr)_6.5rem_9rem_5rem] items-center gap-x-4 px-5 py-3 hover:bg-slate-800/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {t.description}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                    <span className="sm:hidden text-slate-600">·</span>
                    <span className="sm:hidden whitespace-nowrap">
                      {formatDate(t.transaction_date)}
                    </span>
                  </p>
                </div>

                <span className="hidden sm:block text-sm text-slate-400 tabular-nums">
                  {formatDate(t.transaction_date)}
                </span>

                <span
                  className={`text-sm font-semibold text-right tabular-nums ${
                    isIncome ? "text-emerald-400" : "text-slate-100"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatPeso(t.amount)}
                </span>

                <div className="flex items-center justify-end gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(t)}
                    aria-label={`Edit ${t.description}`}
                    className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${focusRing}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setConfirmDeleteId(t.id);
                    }}
                    aria-label={`Delete ${t.description}`}
                    className={`p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ${focusRing}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer summary */}
      {sortedTransactions.length > 0 && (
        <footer className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            {sortedTransactions.length} transaction
            {sortedTransactions.length === 1 ? "" : "s"} shown
          </span>
          <span>
            Net{" "}
            <span
              className={`font-semibold tabular-nums ${
                shownNet >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {shownNet < 0 ? "-" : ""}
              {formatPeso(Math.abs(shownNet))}
            </span>
          </span>
        </footer>
      )}
    </section>
  );
}
