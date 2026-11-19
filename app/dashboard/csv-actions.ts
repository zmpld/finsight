// app/dashboard/csv-actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

// Keep the file comfortably below Next's default 1 MB Server Action body limit
const MAX_FILE_BYTES = 512 * 1024;
const MAX_ROWS = 500;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_AMOUNT = 1_000_000_000;
const MAX_REPORTED_ERRORS = 5;
const MIN_YEAR = 1990;
const MAX_YEAR = 2100;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type ImportState = {
  status: "idle" | "success" | "error";
  message: string;
  details?: string[];
};

const fail = (message: string, details?: string[]): ImportState => ({
  status: "error",
  message,
  details,
});

function isValidDateString(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    !parsed.toISOString().startsWith(dateStr)
  ) {
    return false;
  }
  const year = parsed.getUTCFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

// Accepts "1,234.50", "₱1234.5", "(250.00)"; returns the absolute value or null
function parseAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/[₱\s,]/g, "")
    .replace(/^\((.*)\)$/, "$1")
    .replace(/^-/, "");
  if (!/^\d{1,10}(\.\d+)?$/.test(cleaned)) return null;
  const value = Math.round(Number(cleaned) * 100) / 100;
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) return null;
  return value;
}

const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

// Used with useActionState: (previousState, formData) => newState
export async function importTransactionsCSV(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user || !UUID_REGEX.test(user.id)) {
      return fail("Your session has expired. Please sign in again.");
    }

    // ---- File checks ----
    const file = formData.get("csvFile");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Choose a CSV file to import.");
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return fail("Only .csv files are supported.");
    }
    if (file.size > MAX_FILE_BYTES) {
      return fail(
        `That file is too large. The limit is ${MAX_FILE_BYTES / 1024} KB.`,
      );
    }

    const text = (await file.text()).replace(/^\uFEFF/, "");

    // ---- Parse ----
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const fatal = parsed.errors.find(
      (e) => e.type === "Quotes" || e.type === "Delimiter",
    );
    if (fatal) {
      return fail(
        "The file isn't valid CSV. Check the quotes and separators, then try again.",
      );
    }

    const fields = parsed.meta.fields ?? [];
    if (!fields.includes("amount")) {
      return fail(
        "The file needs a header row with these columns: Date, Description, Amount, Type.",
      );
    }

    const rows = parsed.data;
    if (rows.length === 0) return fail("The file has no transaction rows.");
    if (rows.length > MAX_ROWS) {
      return fail(
        `The file has ${rows.length} rows. Import up to ${MAX_ROWS} at a time.`,
      );
    }

    // ---- Categories the user may use (optional "Category" column) ----
    const { data: accessibleCategories } = await supabase
      .from("categories")
      .select("id, name, type")
      .or(`user_id.eq.${user.id},is_default.eq.true`);

    const categoryLookup = new Map<string, string>();
    for (const c of accessibleCategories ?? []) {
      const key = `${String(c.name).trim().toLowerCase()}|${c.type}`;
      if (!categoryLookup.has(key)) categoryLookup.set(key, c.id);
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });

    // ---- Validate every row; import nothing if any row is bad ----
    const errors: string[] = [];
    let errorCount = 0;
    let unmatchedCategories = 0;
    const toInsert: {
      user_id: string;
      description: string;
      amount: number;
      type: "income" | "expense";
      transaction_date: string;
      category_id: string | null;
    }[] = [];

    rows.forEach((row, i) => {
      const line = i + 2; // header is line 1
      const problems: string[] = [];

      const amount = parseAmount(String(row.amount ?? ""));
      if (amount === null) problems.push("Amount must be a positive number");

      const rawType = String(row.type ?? "")
        .trim()
        .toLowerCase();
      let type: "income" | "expense" = "expense";
      if (rawType) {
        if (rawType === "income" || rawType === "expense") type = rawType;
        else problems.push("Type must be income or expense");
      }

      const rawDate = String(row.date ?? "")
        .trim()
        .slice(0, 10);
      const date = rawDate || today;
      if (!isValidDateString(date))
        problems.push("Date must look like 2026-03-31");

      if (problems.length > 0) {
        errorCount++;
        if (errors.length < MAX_REPORTED_ERRORS) {
          errors.push(`Line ${line}: ${problems.join("; ")}.`);
        }
        return;
      }

      const rawCategory = clean(row.category, 80).toLowerCase();
      let category_id: string | null = null;
      if (rawCategory) {
        category_id = categoryLookup.get(`${rawCategory}|${type}`) ?? null;
        if (!category_id) unmatchedCategories++;
      }

      toInsert.push({
        user_id: user.id,
        description:
          clean(row.description, MAX_DESCRIPTION_LENGTH) ||
          "Imported transaction",
        amount: amount as number,
        type,
        transaction_date: date,
        category_id,
      });
    });

    if (errorCount > 0) {
      const more = errorCount - errors.length;
      if (more > 0)
        errors.push(
          `…and ${more} more row${more === 1 ? "" : "s"} with problems.`,
        );
      return fail(
        "Nothing was imported. Fix these rows and upload the file again.",
        errors,
      );
    }

    const { error } = await supabase.from("transactions").insert(toInsert);
    if (error) {
      console.error("CSV import failed:", error.message);
      return fail("The import failed. Please try again.");
    }

    revalidatePath("/dashboard");

    const details =
      unmatchedCategories > 0
        ? [
            `${unmatchedCategories} row${unmatchedCategories === 1 ? " has" : "s have"} a category that didn't match yours, so ${unmatchedCategories === 1 ? "it was" : "they were"} left unassigned.`,
          ]
        : undefined;

    return {
      status: "success",
      message: `Imported ${toInsert.length} transaction${toInsert.length === 1 ? "" : "s"}.`,
      details,
    };
  } catch (err) {
    console.error("Unexpected CSV import error:", err);
    return fail("Something went wrong while importing. Please try again.");
  }
}
