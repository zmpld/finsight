// app/dashboard/TransactionsSection.tsx
"use client";

import { useState, useTransition } from "react";
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
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "largest" | "smallest" | "date_asc" | "date_desc"
  >("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCatId, setEditCatId] = useState("");
  const [editDate, setEditDate] = useState("");

  const handleStartEdit = (t: Transaction) => {
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
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    const formData = new FormData();
    formData.append("id", id);

    await deleteTransaction(formData);
    startTransition(() => {
      router.refresh();
    });
  };

  // 1. Filter by Type (All / Income / Expense) & Search Query
  const filtered = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;
    const catRef = t.categories;
    const catName = Array.isArray(catRef) ? catRef[0]?.name : catRef?.name;
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (catName && catName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // 2. Sort Logic handling proper signed amounts, creation order, and explicit transaction dates
  const sortedTransactions = [...filtered].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

    if (sortBy === "newest") {
      return timeB - timeA;
    }
    if (sortBy === "oldest") {
      return timeA - timeB;
    }

    if (sortBy === "date_asc" || sortBy === "date_desc") {
      const dateValA = new Date(a.transaction_date || 0).getTime();
      const dateValB = new Date(b.transaction_date || 0).getTime();
      return sortBy === "date_asc" ? dateValA - dateValB : dateValB - dateValA;
    }

    // Properly calculate signed amount (Income = positive, Expense = negative)
    const valA = a.type === "income" ? Number(a.amount) : -Number(a.amount);
    const valB = b.type === "income" ? Number(b.amount) : -Number(b.amount);

    if (sortBy === "largest") {
      return valB - valA; // Highest positive down to lowest negative
    }
    if (sortBy === "smallest") {
      return valA - valB; // Lowest/most negative up to highest positive
    }
    return 0;
  });

  const getCategoryName = (catRef: Transaction["categories"]) => {
    if (!catRef) return "Unassigned";
    if (Array.isArray(catRef)) return catRef[0]?.name || "Unassigned";
    return catRef.name || "Unassigned";
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "newest":
        return "Newest to Oldest";
      case "oldest":
        return "Oldest to Newest";
      case "date_asc":
        return "By date (ASC)";
      case "date_desc":
        return "By date (DESC)";
      case "largest":
        return "Largest to Smallest";
      case "smallest":
        return "Smallest to Largest";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
      {/* Header & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Recent Transactions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, edit, or delete entries without leaving the dashboard.
          </p>
        </div>

        {/* File Explorer Style Sort Dropdown & Shown Badge */}
        <div className="flex items-center gap-3 relative">
          {/* Sort Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-blue-400" />
              <span>Sort</span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>

            {/* Dropdown Menu with Active Indicators */}
            {isSortOpen && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-950 border border-slate-800 shadow-xl py-1.5 z-30"
                onMouseLeave={() => setIsSortOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("newest");
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-900 transition text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${sortBy === "newest" ? "bg-blue-400" : "bg-transparent"}`}
                    />
                    <span>Newest to Oldest</span>
                  </span>
                  {sortBy === "newest" && (
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy("oldest");
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-900 transition text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${sortBy === "oldest" ? "bg-blue-400" : "bg-transparent"}`}
                    />
                    <span>Oldest to Newest</span>
                  </span>
                  {sortBy === "oldest" && (
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setSortBy("largest");
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-900 transition text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${sortBy === "largest" ? "bg-blue-400" : "bg-transparent"}`}
                    />
                    <span>Largest to Smallest</span>
                  </span>
                  {sortBy === "largest" && (
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy("smallest");
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-900 transition text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${sortBy === "smallest" ? "bg-blue-400" : "bg-transparent"}`}
                    />
                    <span>Smallest to Largest</span>
                  </span>
                  {sortBy === "smallest" && (
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setSortBy("date_asc");
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-900 transition text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${sortBy === "date_asc" ? "bg-blue-400" : "bg-transparent"}`}
                    />
                    <span>By date (ASC)</span>
                  </span>
                  {sortBy === "date_asc" && (
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy("date_desc");
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-900 transition text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${sortBy === "date_desc" ? "bg-blue-400" : "bg-transparent"}`}
                    />
                    <span>By date (DESC)</span>
                  </span>
                  {sortBy === "date_desc" && (
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Shown Badge */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-400">
            {sortedTransactions.length} shown
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search description or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Filter Tabs (All / Income / Expense) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`py-2 text-xs font-semibold rounded-lg transition ${
            filterType === "all"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterType("income")}
          className={`py-2 text-xs font-semibold rounded-lg transition ${
            filterType === "income"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setFilterType("expense")}
          className={`py-2 text-xs font-semibold rounded-lg transition ${
            filterType === "expense"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Expense
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
            No transactions found matching your filters.
          </div>
        ) : (
          sortedTransactions.map((t) => {
            const isEditing = editingId === t.id;
            const categoryName = getCategoryName(t.categories);
            const isIncome = t.type === "income";

            if (isEditing) {
              return (
                <div
                  key={t.id}
                  className="bg-slate-950 border border-blue-500/50 p-4 rounded-xl space-y-3 shadow-lg"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">
                        Amount (₱)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">
                        Type
                      </label>
                      <select
                        value={editType}
                        onChange={(e) =>
                          setEditType(e.target.value as "income" | "expense")
                        }
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">
                        Category
                      </label>
                      <select
                        value={editCatId}
                        onChange={(e) => setEditCatId(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
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
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 [&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSaveEdit(t.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition disabled:opacity-50"
                    >
                      {isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={t.id}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between transition"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {t.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {categoryName} · {t.transaction_date}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-bold ${
                      isIncome ? "text-emerald-400" : "text-slate-100"
                    }`}
                  >
                    {isIncome
                      ? `+₱${Number(t.amount).toFixed(2)}`
                      : `-₱${Number(t.amount).toFixed(2)}`}
                  </span>

                  <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(t)}
                      aria-label="Edit transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      aria-label="Delete transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
