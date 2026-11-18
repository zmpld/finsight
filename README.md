# Finsight — Personal Finance & Budget Tracking Dashboard

Finsight is a modern, high-performance personal finance web application built to empower users with deep insights into their cash flow, spending habits, and budgeting goals. Designed with a clean, minimalist dark-mode interface and responsive layouts, Finsight simplifies financial management through automated analytics, interactive visualizations, and robust data tracking.

## Tech Stack & Architecture

Finsight is engineered using a robust modern web stack optimized for speed, type-safety, and real-time database operations:

- Framework & Core: Next.js (App Router) with Turbopack, React, and TypeScript
- Styling & UI: Tailwind CSS with custom dark mode themes and cyan/blue accents
- Database & Backend: Supabase (PostgreSQL, Row-Level Security, and Authentication)
- Data Visualization: Recharts (Customized interactive donut charts, bar charts, and trends)
- State & Interactions: Client-server hybrid architecture utilizing React Server Components (RSCs) and modular client-side hooks

## Key Features & Capabilities

Multi-Tab Dashboard Architecture:

- Overview: High-level KPI cards (Net Cash Flow, Period Income, Expenses, Savings Rate) and progress trackers.
- Analytics: Detailed financial charts with custom tooltips and currency formatting (₱ Philippine Peso).
- Monthly Budgets: Category-specific budget tracking with progress indicators.
- Transactions Ledger: Comprehensive search, type filtering (Income/Expense), and multi-criteria sorting (by Date or Amount with Ascending/Descending controls).

Contextual Drill-Through Inspector:

- Interactive chart slices and monthly bars allow users to drill down into underlying transactions.
- A slide-over inspector panel highlights active selections and displays granular records while dynamically clearing chart label clutter for a clean UI.
- CSV Statement Import: Bulk upload financial transaction histories effortlessly.
- Account & Security Settings: Full profile management (display names), secure password updates, and account deletion protocols.

## System Architecture

Finsight leverages a modular full-stack architecture separating server-side rendering/data fetching from interactive client components:

```text
┌─────────────────────────────────────────────────────────────┐
│ Client Browser │
│ (Next.js Client Components: Charts, Filters, Settings) │
└──────────────────────────────┬──────────────────────────────┘
│ HTTPS / Server Actions
┌──────────────────────────────v──────────────────────────────┐
│ Next.js App Router │
│ (Server-Side Rendering, Route Handlers & Server Actions) │
└──────────────────────────────┬──────────────────────────────┘
│ Supabase Client SDK
┌──────────────────────────────v──────────────────────────────┐
│ Supabase Backend │
│ (PostgreSQL DB, Auth, and Row-Level Security) │
└─────────────────────────────────────────────────────────────┘
```
