import Link from "next/link";
import { Receipt } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-base font-semibold tracking-tight text-slate-900 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:gap-2.5 sm:text-lg"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white sm:h-8 sm:w-8">
            <Receipt className="h-4 w-4 sm:h-4.5 sm:w-4.5" aria-hidden />
          </span>
          <span>{APP_NAME}</span>
        </Link>
        <Link
          href="/tracker"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:h-9 sm:px-4 sm:text-sm"
        >
          Track an expense
        </Link>
      </div>
    </header>
  );
}
