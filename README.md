# Finsight: Personal Finance & Budget Tracking Dashboard

![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Auth-3FCF8E?logo=supabase&logoColor=white)

Finsight is a personal finance web app that turns raw income and expense records into clear answers: where your money goes, how this month compares with the last, and whether you are staying inside your budgets. It pairs a clean, flat dark interface with interactive charts, on-demand AI insights, and a security-first backend built on Supabase.

**Live demo:** https://finsight-zweb.vercel.app

<!--
Add screenshots to docs/screenshots/ and uncomment:
![Dashboard overview](docs/screenshots/overview.png)
![Analytics with drill-through](docs/screenshots/analytics.png)
-->

## Features

**Dashboard**

- **Overview:** KPI cards for net cash flow (with month-over-month change), income, expenses and savings rate, plus financial-health meters, top spending categories and charts.
- **Analytics:** Interactive donut and monthly cash-flow charts with a net line. Select a slice, bar or legend row to open a side inspector with the underlying transactions.
- **Monthly budgets:** Set a limit per category, then track usage with status chips (on track, near limit, over budget), an 80% marker and an overall summary.
- **Transactions:** Search, filter by type, sort by date or amount, edit inline, and delete with an inline confirmation.
- **Timeframe filter:** Switch between a month, all-time history or a custom month range. The active tab is preserved when the period changes.

**Data in**

- **CSV import:** Upload a bank statement with Date, Description, Amount, Type and an optional Category column. Every row is validated and the import is all-or-nothing, with line-numbered errors for anything that fails.
- **Manual entry:** A fast form with an icon-based category picker.

**AI insights**

- On-demand spending analysis using Google Gemini. It only runs when you click, is rate limited per user, and treats transaction text as untrusted input.

**Accounts**

- **Multiple accounts per email:** Create separate accounts under the same email, each with its own display name and password. Sign-in resolves the right account automatically and asks for the display name only when needed.
- **Settings:** Update your display name (kept in sync between the `profiles` table and Supabase Auth), change your password (signs out other devices), and delete your account with password confirmation.

## Tech Stack

| Area              | Technology                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| Framework         | Next.js (App Router, React Server Components, Server Actions), React, TypeScript    |
| Styling           | Tailwind CSS with a small set of design tokens: one surface, one border, one accent |
| Database and auth | Supabase: PostgreSQL, Row Level Security, Supabase Auth (`@supabase/ssr`)           |
| Charts            | Recharts                                                                            |
| AI                | Google Gemini via `@google/genai`                                                   |
| CSV parsing       | PapaParse                                                                           |
| Icons             | Lucide                                                                              |
| Hosting           | Vercel                                                                              |

## Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                      Client browser                       │
│  Charts, filters, forms, settings (Client Components)     │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTPS · Server Actions
┌─────────────────────────────▼─────────────────────────────┐
│                    Next.js App Router                     │
│  Server Components · Server Actions · Route Handlers      │
│  Middleware session gate · Security headers               │
└───────────────┬─────────────────────────────┬─────────────┘
                │ Supabase SDK                │ HTTPS (server only)
┌───────────────▼─────────────┐   ┌───────────▼─────────────┐
│       Supabase backend      │   │      Google Gemini      │
│  PostgreSQL · Auth · RLS    │   │   On-demand insights    │
└─────────────────────────────┘   └─────────────────────────┘
```

Reads happen in Server Components, so data is fetched with the signed-in user's session and filtered by Row Level Security. All writes go through Server Actions, which validate input again on the server. The browser never talks to Gemini, and the service-role key is used only in server code.

## Security

- **Row Level Security** on every table, so a user can only read or change their own rows.
- **Server-side validation** of every write: amounts, dates, UUIDs, text length and control characters. Category ownership is checked before saving a transaction or budget.
- **Session checks everywhere:** `auth.getUser()` is called in the middleware, pages and every Server Action. The middleware is a convenience gate, not the only protection.
- **Sensitive actions re-authenticate:** deleting an account needs your password and a typed confirmation, and changing a password revokes other sessions.
- **AI hardening:** per-user rate limit, ledger text stripped of angle brackets and control characters, a request timeout, and output rendered as plain React elements, never raw HTML.
- **Import hardening:** file type, size and row limits, strict row validation, and generic errors returned to the client.
- **HTTP security headers:** Content-Security-Policy, `X-Frame-Options`, `nosniff`, a referrer policy, a permissions policy and HSTS.
- **Tamper-resistant profiles:** users can edit only `display_name` and `currency`. Email columns are controlled by the server and database triggers.

## Database

| Table                 | Purpose                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| `profiles`            | One row per account: `display_name`, `contact_email`, `login_email`, `currency` |
| `categories`          | Default and per-user income and expense categories, with a color                |
| `transactions`        | Income and expense records                                                      |
| `budgets`             | Monthly limit per category, keyed by `YYYY-MM`                                  |
| `ai_insight_requests` | Request log used for AI rate limiting                                           |

SQL lives in `supabase/`:

- `rls-checklist.sql`: verification queries and Row Level Security policy templates.
- `multi-account-migration.sql`: profile columns, constraints, the profile-creation trigger and profile permissions.
