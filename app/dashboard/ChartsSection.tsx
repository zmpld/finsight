"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function ChartsSection({
  transactions,
}: {
  transactions: any[];
}) {
  // 1. Prepare Category Breakdown Data for Pie Chart
  const expenseMap: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const catName = t.categories?.name || "Unassigned";
      expenseMap[catName] = (expenseMap[catName] || 0) + Number(t.amount);
    });

  const pieData = Object.keys(expenseMap).map((key) => ({
    name: key,
    value: expenseMap[key],
  }));

  // 2. Prepare Monthly Trend Data for Bar Chart
  const monthlyMap: { [key: string]: { income: number; expense: number } } = {};
  transactions.forEach((t) => {
    const month = t.transaction_date.substring(0, 7); // 'YYYY-MM'
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 };
    if (t.type === "income") monthlyMap[month].income += Number(t.amount);
    if (t.type === "expense") monthlyMap[month].expense += Number(t.amount);
  });

  const barData = Object.keys(monthlyMap)
    .sort()
    .map((month) => ({
      month,
      Income: monthlyMap[month].income,
      Expense: monthlyMap[month].expense,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Expense Breakdown Donut Chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">
          Spending Breakdown by Category
        </h2>
        {pieData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  label
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1e293b",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-slate-500">
            No expense data available
          </div>
        )}
      </div>

      {/* Monthly Cash Flow Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">Monthly Cash Flow Trends</h2>
        {barData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1e293b",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-slate-500">
            No trend data available
          </div>
        )}
      </div>
    </div>
  );
}
