// app/dashboard/AddTransactionSection.tsx
"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  color?: string;
}

// Helper to map category names to clean Lucide icons
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

  // Filter categories based on active transaction Type (Expense vs Income)
  const filteredCategories = categories.filter((c) => c.type === txType);

  const handleTypeChange = (newType: "expense" | "income") => {
    setTxType(newType);
    // Reset selected category if it doesn't belong to the new type
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
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">Add Transaction</h2>
        <form action={handleFormAction} className="space-y-4">
          {/* Hidden input to pass the chosen category ID to the server action */}
          <input
            type="hidden"
            name="category_id"
            value={selectedCategory ? selectedCategory.id : ""}
          />

          {/* Type Dropdown */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">
              Type
            </label>
            <select
              name="type"
              value={txType}
              onChange={(e) =>
                handleTypeChange(e.target.value as "expense" | "income")
              }
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              placeholder="e.g. Grocery Store"
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">
              Amount (₱)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="amount"
              placeholder="0.00"
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Modal Trigger*/}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">
              Category
            </label>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 px-3 py-2 text-sm text-left flex items-center justify-between transition"
            >
              {selectedCategory && SelectedIcon ? (
                <span className="flex items-center gap-2 text-slate-100 font-medium">
                  <span
                    className="h-6 w-6 rounded-md flex items-center justify-center text-white"
                    style={{
                      backgroundColor: selectedCategory.color || "#3b82f6",
                    }}
                  >
                    <SelectedIcon className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    {selectedCategory.name}{" "}
                    <span className="text-xs text-slate-400">
                      ({selectedCategory.type})
                    </span>
                  </span>
                </span>
              ) : (
                <span className="text-slate-400">Select a Category</span>
              )}
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs uppercase text-slate-400 mb-1">
              Date
            </label>
            <input
              type="date"
              name="transaction_date"
              defaultValue={today}
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm 
              text-slate-100 focus:outline-none focus:border-blue-500 
              [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-sm font-semibold transition text-white disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Transaction"}
          </button>
        </form>
      </div>

      {/* Category Grid Pop-up Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center h-full bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold">
                {txType} Categories
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 4-Column Icon Grid matching wireframe */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[80vh] overflow-y-auto pr-1">
              {/* Unassigned Option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setIsModalOpen(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  selectedCategory === null
                    ? "bg-blue-600/15 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-300"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
                  <Ban className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium leading-tight">
                  Unassigned
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  (none)
                </span>
              </button>

              {/* Dynamic Category Cards */}
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
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500 text-white"
                        : "bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-200"
                    }`}
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center mb-2 text-white shadow-sm"
                      style={{ backgroundColor: cat.color || "#3b82f6" }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      ({cat.type})
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-slate-800 text-center">
              <p className="text-sm font-semibold text-slate-300">
                Select a Category
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
