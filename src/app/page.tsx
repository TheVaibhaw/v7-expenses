import { ExpenseTracker } from "@/components/ExpenseTracker";
import { Support } from "@/components/Support";
import { APP_NAME } from "@/lib/constants";

const FAQS = [
  {
    q: "Is this expense tracker really free?",
    a: "Yes. There is no signup, no account, and no paywall. Add expenses, download a PDF, and email it - all free.",
  },
  {
    q: "Where is my expense data stored?",
    a: "Entirely in your browser's local storage, on your own device. Nothing is saved to a server or database.",
  },
  {
    q: "Can I email the expense PDF to someone else?",
    a: "Yes. Enter one or more recipient email addresses (comma or line separated) and the same PDF is generated and emailed as an attachment.",
  },
  {
    q: "What currency does the PDF use?",
    a: "Indian Rupees (INR / ₹) by default, but you can switch to USD, EUR, or GBP from the currency selector - it updates the on-screen totals, the downloaded PDF, and the emailed copy.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pt-14 pb-6 text-center sm:px-6 sm:pt-20">
        <div
          aria-hidden
          className="glow-blob animate-float-slow pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/30"
        />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Free &middot; Private &middot; No signup
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Track purchases. Generate a professional PDF. Email it in one click.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            {APP_NAME} turns a list of items you bought into a clean, shareable record - with a
            running total and your payment details, ready to download or send by email.
          </p>
        </div>
      </section>

      <ExpenseTracker />

      <section id="faq" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="card p-5">
              <h3 className="font-semibold text-slate-900">{faq.q}</h3>
              <p className="mt-2 text-sm text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <Support />
    </>
  );
}
