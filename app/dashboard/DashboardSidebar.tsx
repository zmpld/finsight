// app/dashboard/DashboardSidebar.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  PiggyBank,
  ReceiptText,
  Settings,
  LogOut,
} from "lucide-react";
import { logout } from "./actions";

export default function DashboardSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const setTab = (tabName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    router.push(`/dashboard?${params.toString()}`);
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "budgets", label: "Monthly Budget", icon: PiggyBank },
    { id: "transactions", label: "Transactions", icon: ReceiptText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header with Fixed Logo Size and Clean Alignment */}
        <div className="h-20 border-b border-slate-800 flex items-center px-6 gap-3.5">
          <img
            src="/finsight-logo.png"
            alt="Finsight Logo"
            className="h-8 w-8 object-contain shrink-0 rounded-lg"
          />
          <div className="flex flex-col justify-center leading-tight">
            <span className="font-extrabold text-base tracking-tight text-white">
              Finsight
            </span>
            <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-0.5">
              PRO DASHBOARD
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-4 space-y-1.5">
          <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
            WORKSPACE
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-500"}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent transition"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Log out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
