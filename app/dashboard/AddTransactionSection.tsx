// app/dashboard/AddTransactionSection.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addTransaction } from "./actions";
import {
  Utensils,
  Home,
  Car,
  Zap,
  Dumbbell,
  Plane,
  GraduationCap,
  HeartPulse,
  Film,
  ShoppingBag,
  Gift,
  PawPrint,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  HandCoins,
  Coins,
  Tag,
  X,
  ChevronRight,
  Ban,
  Plus,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
}

// Map category names to Lucide icons
function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("pet")) return PawPrint;
  if (lower.includes("food") || lower.includes("dining")) return Utensils;
  if (lower.includes("housing") || lower.includes("rent")) return Home;
  if (lower.includes("transport")) return Car;
  if (lower.includes("utilit")) return Zap;
  if (
    lower.includes("fitness") ||
    lower.includes("gym") ||
    lower.includes("sport")
  )
    return Dumbbell;
  if (lower.includes("travel") || lower.includes("leisure")) return Plane;
  if (lower.includes("education") || lower.includes("professional"))
    return GraduationCap;
  if (lower.includes("medical") || lower.includes("health")) return HeartPulse;
  if (lower.includes("entertainment") || lower.includes("subscription"))
    return Film;
  if (lower.includes("shopping") || lower.includes("personal"))
    return ShoppingBag;
  if (lower.includes("allowance")) return HandCoins;
  if (lower.includes("gift") || lower.includes("donation")) return Gift;
  if (lower.includes("salary") || lower.includes("wage")) return Briefcase;
  if (lower.includes("freelance") || lower.includes("hustle")) return Laptop;
  if (lower.includes("business") || lower.includes("invest")) return TrendingUp;
  if (lower.includes("other income")) return Coins;
  if (lower.includes("misc")) return MoreHorizontal;
  return Tag;
}

const inputClass =
  "w-full rounded-lg bg-slate-950 border border-slate-700/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400";

export default function AddTransactionSection({
  categories,
  today,
}: {
  categories: Category[];
  today: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === txType);

  // Escape closes the category dialog
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isModalOpen]);

  const handleTypeChange = (newType: "expense" | "income") => {
    setTxType(newType);
    // Clear the category if it belongs to the other type
    if (selectedCategory && selectedCategory.type !== newType) {
      setSelectedCategory(null);
    }
  };

  const handleFormAction = async (formData: FormData) => {
    await addTransaction(formData);
    setSelectedCategory(null);
    startTransition(() => {
      router.refresh();
    });
  };

  const SelectedIcon = selectedCategory
    ? getCategoryIcon(selectedCategory.name)
    : null;

  return (
    <>
      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
            <Plus className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Add transaction
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record income or an expense.
            </p>
          </div>
        </header>

        <form action={handleFormAction} className="p-5 space-y-5">
          {/* Values the server action reads */}
          <input type="hidden" name="type" value={txType} />
          <input
            type="hidden"
            name="category_id"
            value={selectedCategory ? selectedCategory.id : ""}
          />

          {/* Type toggle */}
          <div>
            <span className={labelClass} id="tx-type-label">
              Type
            </span>
            <div
              role="radiogroup"
              aria-labelledby="tx-type-label"
              className="grid grid-cols-2 p-1 rounded-lg bg-slate-950 border border-slate-800"
            >
              {(["expense", "income"] as const).map((type) => {
                const active = txType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleTypeChange(type)}
                    className={`py-2 text-sm font-medium rounded-md transition-colors ${focusRing} ${
                      active
                        ? type === "expense"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-emerald-500/15 text-emerald-400"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {type === "expense" ? "Expense" : "Income"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="tx-amount" className={labelClass}>
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                ₱
              </span>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                name="amount"
                placeholder="0.00"
                required
                className={`${inputClass} pl-7 tabular-nums`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tx-desc" className={labelClass}>
              Description
            </label>
            <input
              id="tx-desc"
              type="text"
              name="description"
              placeholder="e.g. Grocery store"
              required
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <span className={labelClass}>Category</span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              aria-haspopup="dialog"
              className={`w-full rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 px-3 py-2 text-sm text-left flex items-center justify-between transition-colors ${focusRing}`}
            >
              {selectedCategory && SelectedIcon ? (
                <span className="flex items-center gap-2.5 text-slate-100">
                  <span
                    className="h-6 w-6 rounded-md flex items-center justify-center text-white"
                    style={{
                      backgroundColor: selectedCategory.color || "#3b82f6",
                    }}
                  >
                    <SelectedIcon className="h-3.5 w-3.5" />
                  </span>
                  {selectedCategory.name}
                </span>
              ) : (
                <span className="text-slate-500 py-0.5">Choose a category</span>
              )}
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="tx-date" className={labelClass}>
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              name="transaction_date"
              defaultValue={today}
              required
              className={`${inputClass} [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={`w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${focusRing}`}
          >
            {isPending ? "Saving…" : "Save transaction"}
          </button>
        </form>
      </section>

      {/* Category dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-dialog-title"
            className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <h3
                  id="category-dialog-title"
                  className="text-sm font-semibold text-slate-100"
                >
                  Choose a category
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {txType === "expense" ? "expense" : "income"}{" "}
                  categories
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                autoFocus
                className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${focusRing}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {/* No category */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setIsModalOpen(false);
                }}
                aria-pressed={selectedCategory === null}
                className={`flex flex-col items-center p-3 rounded-lg border text-center transition-colors ${focusRing} ${
                  selectedCategory === null
                    ? "bg-blue-500/10 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-300"
                }`}
              >
                <span className="h-10 w-10 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
                  <Ban className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium leading-tight">
                  No category
                </span>
              </button>

              {filteredCategories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.name);
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsModalOpen(false);
                    }}
                    aria-pressed={isSelected}
                    className={`flex flex-col items-center p-3 rounded-lg border text-center transition-colors ${focusRing} ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500 text-white"
                        : "bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-200"
                    }`}
                  >
                    <span
                      className="h-10 w-10 rounded-lg flex items-center justify-center mb-2 text-white"
                      style={{ backgroundColor: cat.color || "#3b82f6" }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-medium leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredCategories.length === 0 && (
              <p className="px-5 pb-5 text-sm text-slate-500 text-center">
                No {txType} categories yet.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
