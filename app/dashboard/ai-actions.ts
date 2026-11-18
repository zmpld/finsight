"use server";

import { createClient } from "@/utils/supabase/server";

export async function generateFinancialInsights() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: transactions } = await supabase
    .from("transactions")
    .select("transaction_date, type, amount, description, categories(name)")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(50);

  if (!transactions || transactions.length === 0) {
    return "Not enough transaction data yet to generate insights. Add some transactions or import a CSV statement first!";
  }

  const summary = transactions
    .map((t) => {
      const category = Array.isArray(t.categories)
        ? t.categories[0]?.name
        : t.categories?.name;
      return `- [${t.transaction_date}] ${t.type.toUpperCase()}: ₱${t.amount} (${category || "Unassigned"}) - ${t.description}`;
    })
    .join("\n");

  const prompt = `
  You are an expert financial advisor. Review the following recent transaction ledger for a user tracking expenses in Philippine Pesos (₱):
  ${summary}

  Provide 3 concise, highly actionable, and encouraging financial insights or recommendations based on their spending patterns. 
  Keep it clear, professional, and formatted in short bullet points. Highlight any major spending categories that deserve attention.
  `;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return "Gemini API key is missing. Add GEMINI_API_KEY to your .env.local and restart the dev server.";
  }

  try {
    // Lazy-load Gemini only when the user requests insights.
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      // gemini-2.5-flash is unavailable to new API keys; use the current flash model.
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    return response.text || "No insights could be generated at this time.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown Gemini API error";
    return `Failed to generate AI insights: ${message}`;
  }
}
