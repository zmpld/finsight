"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateFinancialInsights } from "./ai-actions";

export default function AIInsightsSection() {
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateFinancialInsights();
        setInsight(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate insights. Please try again.",
        );
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            AI Financial Insights
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            On-demand analysis powered by Gemini — only runs when you ask.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {isPending ? "Analyzing..." : insight ? "Refresh Insights" : "Generate Insights"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!error && !insight && !isPending && (
        <p className="text-sm text-slate-500">
          Click Generate to review your recent transactions and get savings
          recommendations.
        </p>
      )}

      {isPending && (
        <p className="text-sm text-slate-400 animate-pulse">
          Reviewing your ledger…
        </p>
      )}

      {insight && !isPending && (
        <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
          {insight}
        </div>
      )}
    </div>
  );
}
