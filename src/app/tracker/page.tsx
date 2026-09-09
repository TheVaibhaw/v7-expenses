import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExpenseTracker } from "@/components/ExpenseTracker";
import { APP_NAME, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Track an Expense",
  description:
    "Add purchases, choose a currency, split the bill if needed, then download or email a professional PDF expense report - free, no signup.",
  alternates: {
    canonical: `${SITE_URL}/tracker`,
  },
};

export default function TrackerPage() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to {APP_NAME}
        </Link>
      </div>
      <ExpenseTracker />
    </>
  );
}
