// app/dashboard/AIInsightsSection.tsx
"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { generateFinancialInsights } from "./ai-actions";

/* ------------------------------------------------------------------ */
/* Tiny, safe formatter for the model's reply.                         */
/* Output is built from React elements only (never raw HTML), so any   */
/* markup in the reply is shown as plain text and cannot run.          */
/* ------------------------------------------------------------------ */
type Block =
  | { kind: "heading"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "summary"; text: string };

function parseInsights(raw: string): Block[] {
  const blocks: Block[] = [];
  let inSummary = false;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // "Summary" line, with or without text after it
    const summaryMatch = trimmed.match(/^[#*\s]*summary[*\s]*:?[*\s]*(.*)$/i);
    if (
      summaryMatch &&
      trimmed.length < 400 &&
      /^[#*\s]*summary/i.test(trimmed)
    ) {
      inSummary = true;
      const rest = summaryMatch[1].trim();
      if (rest) blocks.push({ kind: "summary", text: rest });
      continue;
    }

    if (inSummary) {
      blocks.push({ kind: "summary", text: trimmed.replace(/^[-•*]\s+/, "") });
      continue;
    }

    // Markdown headings, or a line that is entirely bold
    const heading =
      trimmed.match(/^#{1,4}\s+(.*)$/) || trimmed.match(/^\*\*([^*]+)\*\*:?$/);
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1].trim() });
      continue;
    }

    // Bullets ("- ", "• ", "* ") and numbered items ("1. ")
    const bullet = trimmed.match(/^(?:[-•]|\*(?!\*)|\d+[.)])\s+(.*)$/);
    if (bullet) {
      blocks.push({ kind: "bullet", text: bullet[1].trim() });
      continue;
    }

    blocks.push({ kind: "paragraph", text: trimmed });
  }
  return blocks;
}

// Turn **bold** into <strong>; strip stray asterisks otherwise
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-semibold text-slate-100">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part.replace(/\*+/g, "")}</span>
    ),
  );
}

function InsightBody({ text }: { text: string }) {
  const blocks = parseInsights(text);
  const summary = blocks.filter((b) => b.kind === "summary");
  const main = blocks.filter((b) => b.kind !== "summary");

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {main.map((b, i) => {
          if (b.kind === "heading") {
            return (
              <h3
                key={i}
                className="pt-2 first:pt-0 text-sm font-semibold text-slate-100"
              >
                {renderInline(b.text)}
              </h3>
            );
          }
          if (b.kind === "bullet") {
            return (
              <div
                key={i}
                className="flex items-start gap-3 text-sm leading-relaxed text-slate-300"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <p>{renderInline(b.text)}</p>
              </div>
            );
          }
          return (
            <p key={i} className="text-sm leading-relaxed text-slate-300">
              {renderInline(b.text)}
            </p>
          );
        })}
      </div>

      {summary.length > 0 && (
        <div className="rounded-lg border border-slate-800 border-l-2 border-l-blue-500 bg-slate-900 px-4 py-3">
          <p className="text-sm font-semibold text-slate-100 mb-1">Summary</p>
          <div className="space-y-1.5">
            {summary.map((b, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-300">
                {renderInline(b.text)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Panel --------------------------------- */
export default function AIInsightsSection() {
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateFinancialInsights();
        if (!result.success) {
          setError(result.error);
          return;
        }
        setInsight(result.insight);
        setGeneratedAt(new Date());
      } catch (err) {
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Failed to generate insights. Please try again.",
        );
      }
    });
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Sparkles className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-100">
              AI financial insights
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sends your 50 most recent transactions to Google Gemini for
              analysis. It only runs when you ask.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending
            ? "Analyzing…"
            : insight
              ? "Refresh insights"
              : "Generate insights"}
        </button>
      </header>

      <div className="p-5" aria-live="polite">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2.5"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isPending && (
          <div
            role="status"
            aria-label="Analyzing your transactions"
            className="space-y-3 animate-pulse"
          >
            <div className="h-3.5 w-1/3 rounded bg-slate-800" />
            <div className="h-3 w-full rounded bg-slate-800/70" />
            <div className="h-3 w-11/12 rounded bg-slate-800/70" />
            <div className="h-3 w-4/5 rounded bg-slate-800/70" />
          </div>
        )}

        {!isPending && insight && (
          <div className="space-y-4">
            <InsightBody text={insight} />
            {generatedAt && (
              <p className="text-xs text-slate-500">
                Generated at{" "}
                {generatedAt.toLocaleTimeString("en-PH", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                . AI can make mistakes, so check important figures against your
                ledger.
              </p>
            )}
          </div>
        )}

        {!isPending && !insight && !error && (
          <p className="text-sm text-slate-400">
            Generate a short review of your spending, savings and budget habits,
            with suggestions for what to change next month.
          </p>
        )}
      </div>
    </section>
  );
}
