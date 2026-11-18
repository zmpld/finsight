// app/dashboard/AIInsightsSection.tsx
"use client";

import { useState, useTransition } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
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

  // Helper parser to convert raw AI response lines into clean formatted UI blocks
  const renderFormattedInsights = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim() !== "");

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Check if line is a bullet point or bold header line
      if (
        trimmed.startsWith("•") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("-")
      ) {
        const cleanLine = trimmed.replace(/^[•*\-]\s*/, "");
        const parts = cleanLine.split(":**");

        if (parts.length >= 2) {
          const title = parts[0].replace(/\*\*/g, "").replace(":", "");
          const body = parts[1].replace(/\*\*/g, "");

          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed mb-2.5"
            >
              <span className="text-blue-400 mt-1">•</span>
              <p>
                <strong className="text-white font-semibold">{title}:</strong>
                {body}
              </p>
            </div>
          );
        } else {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed mb-2.5"
            >
              <span className="text-blue-400 mt-1">•</span>
              <p>{cleanLine.replace(/\*\*/g, "")}</p>
            </div>
          );
        }
      } else if (trimmed.toLowerCase().includes("summary")) {
        const body = trimmed.replace(/\*\*Summary:?\*\*/i, "").trim();
        return (
          <div
            key={idx}
            className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed"
          >
            <strong className="text-blue-400 font-semibold uppercase tracking-wider text-[11px] block mb-1">
              Summary
            </strong>
            <p>{body.replace(/\*\*/g, "")}</p>
          </div>
        );
      } else {
        return (
          <p key={idx} className="text-xs text-slate-300 leading-relaxed mb-2">
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              AI Financial Insights
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              On-demand analysis powered by Gemini — only runs when you ask.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
          />
          {isPending
            ? "Analyzing..."
            : insight
              ? "Refresh Insights"
              : "Generate Insights"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && !insight && !isPending && (
        <p className="text-xs text-slate-500 py-2">
          Click Generate Insights to review your ledger and get custom
          recommendations.
        </p>
      )}

      {isPending && (
        <div className="py-6 text-center space-y-2">
          <p className="text-xs text-blue-400 font-medium animate-pulse">
            Analyzing your recent transactions…
          </p>
        </div>
      )}

      {insight && !isPending && (
        <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-5 space-y-2">
          {renderFormattedInsights(insight)}
        </div>
      )}
    </div>
  );
}
