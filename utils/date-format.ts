export function formatMonthLabel(yearMonth: string) {
  if (!yearMonth || yearMonth === "all") return "All-Time History";
  const [year, month] = yearMonth.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}
