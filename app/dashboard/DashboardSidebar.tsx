// app/dashboard/DashboardSidebar.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  PiggyBank,
  ReceiptText,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "./actions";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "budgets", label: "Monthly budget", icon: PiggyBank },
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "settings", label: "Settings", icon: Settings },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/finsight-logo.png"
        alt=""
        className="h-8 w-8 object-contain shrink-0 rounded-lg"
      />
      <span className="font-semibold text-base tracking-tight text-white">
        Finsight
      </span>
    </div>
  );
}

export default function DashboardSidebar() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  // Keep the current period filters when switching tabs
  const hrefFor = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    return `/dashboard?${params.toString()}`;
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen flex-col justify-between bg-slate-900 border-r border-slate-800">
        <div>
          <div className="h-16 px-6 flex items-center border-b border-slate-800">
            <Brand />
          </div>

          <nav aria-label="Dashboard" className="p-3 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <Link
                  key={id}
                  href={hrefFor(id)}
                  scroll={false}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-500" />
                  )}
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? "text-blue-400"
                        : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
          <Brand />
          <form action={logout}>
            <button
              type="submit"
              aria-label="Log out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
        <nav
          aria-label="Dashboard"
          className="flex gap-1 overflow-x-auto px-3 sm:px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <Link
                key={id}
                href={hrefFor(id)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-500"}`}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
