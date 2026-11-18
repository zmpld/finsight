"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

function parseTransactionForm(formData: FormData) {
  const amount = parseFloat(String(formData.get("amount") ?? ""));
  const type = String(formData.get("type") ?? "") as "income" | "expense";
  const description = String(formData.get("description") ?? "").trim();
  const category_id = String(formData.get("category_id") ?? "");
  const transaction_date = String(formData.get("transaction_date") ?? "");

  if (!description) throw new Error("Description is required");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  if (type !== "income" && type !== "expense") {
    throw new Error("Type must be income or expense");
  }

  return {
    amount,
    type,
    description,
    category_id: category_id || null,
    transaction_date:
      transaction_date || new Date().toISOString().split("T")[0],
  };
}

export async function addTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = parseTransactionForm(formData);

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    ...payload,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Transaction id is required");

  const payload = parseTransactionForm(formData);

  const { error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Transaction id is required");

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
