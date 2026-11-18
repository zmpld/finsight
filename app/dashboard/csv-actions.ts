"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

export async function importTransactionsCSV(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("csvFile") as File;
  if (!file) throw new Error("No file uploaded");

  const text = await file.text();

  // Parse CSV using PapaParse
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data as any[];
  const transactionsToInsert = rows.map((row) => ({
    user_id: user.id,
    description: row.Description || row.description || "Imported Transaction",
    amount: parseFloat(row.Amount || row.amount || 0),
    type: (row.Type || row.type || "expense").toLowerCase(),
    transaction_date:
      row.Date || row.date || new Date().toISOString().split("T")[0],
  }));

  const { error } = await supabase
    .from("transactions")
    .insert(transactionsToInsert);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
