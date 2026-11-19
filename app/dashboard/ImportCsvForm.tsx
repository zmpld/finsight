// app/dashboard/ImportCsvForm.tsx
"use client";

import { useActionState, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { importTransactionsCSV } from "./csv-actions";
import type { ImportState } from "./csv-actions";

const MAX_FILE_KB = 512;
const initialState: ImportState = { status: "idle", message: "" };

const TEMPLATE =
  "Date,Description,Amount,Type,Category\n" +
  "2026-01-15,Grocery store,1250.50,expense,Food\n" +
  "2026-01-31,Monthly salary,30000,income,Salary\n";

export default function ImportCsvForm() {
  const [state, formAction, isPending] = useActionState(
    importTransactionsCSV,
    initialState,
  );
  const [clientError, setClientError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_FILE_KB * 1024) {
      setClientError(`That file is too large. The limit is ${MAX_FILE_KB} KB.`);
      e.target.value = "";
    } else {
      setClientError(null);
    }
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
          <Upload className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Import CSV statement
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Columns: Date, Description, Amount, Type, Category (optional).
          </p>
        </div>
      </header>

      <form action={formAction} className="p-5 space-y-4">
        <input
          type="file"
          name="csvFile"
          accept=".csv,text/csv"
          required
          onChange={onFileChange}
          aria-describedby="csv-help"
          className="w-full text-xs text-slate-400 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:transition-colors"
        />
        <p id="csv-help" className="text-xs text-slate-500">
          Up to 500 rows and {MAX_FILE_KB} KB. Dates use YYYY-MM-DD, and Type is
          income or expense. If any row is invalid, nothing is imported.{" "}
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
            download="finsight-template.csv"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            <Download className="h-3 w-3" />
            Download template
          </a>
        </p>

        {clientError && (
          <p role="alert" className="text-sm text-red-400">
            {clientError}
          </p>
        )}

        {state.status !== "idle" && !isPending && (
          <div
            role={state.status === "error" ? "alert" : "status"}
            className={`rounded-lg border px-3.5 py-3 text-sm flex items-start gap-2.5 ${
              state.status === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {state.status === "success" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{state.message}</p>
              {state.details?.map((d, i) => (
                <p key={i} className="text-xs opacity-90">
                  {d}
                </p>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
        >
          {isPending ? "Importing…" : "Import transactions"}
        </button>
      </form>
    </section>
  );
}
