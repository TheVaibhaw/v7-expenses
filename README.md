# v7-expenses

The V7 Ninja Expense Tracker - a free, browser-based tool for tracking purchases/expenses and
generating a professional PDF record, with an option to email it. Part of [The V7 Ninja](https://thev7ninja.in) family of tools.

## Getting started

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `RESEND_API_KEY` - API key from [resend.com](https://resend.com), required for the "Send via Email" feature.
- `RESEND_FROM_EMAIL` - sender address on a domain verified in your Resend dashboard.
- `NEXT_PUBLIC_APP_URL` - optional override for the canonical site URL.

## Data & privacy

All expense data (line items, payment details) is stored only in the browser's `localStorage`.
The `/api/send-expense-email` route receives data purely to render and send one PDF - nothing
is persisted server-side.
