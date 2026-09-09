import { Receipt } from "lucide-react";
import { APP_NAME, CREATOR_URL } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-accent" aria-hidden />
          <p>
            &copy; {year} {APP_NAME}. All rights reserved.
          </p>
        </div>
        <p>
          Made with love by{" "}
          <a
            href={CREATOR_URL}
            target="_blank"
            rel="noopener noreferrer me"
            className="font-medium text-slate-700 underline underline-offset-2 hover:text-accent"
          >
            Vaibhaw Kumar
          </a>
        </p>
      </div>
    </footer>
  );
}
