"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Download, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AUTOSAVE_DEBOUNCE_MS, CURRENCY_SYMBOL, PAYMENT_METHODS } from "@/lib/constants";
import { loadDraft, saveDraft } from "@/lib/storage";
import type { ExpenseLineItem, PayerDetails } from "@/lib/types";
import { calculateTotal, getValidLineItems, validateRecipients } from "@/lib/validation";
import { generateExpensePdf } from "@/lib/generate-expense-pdf";

function createEmptyLineItem(): ExpenseLineItem {
  const now = new Date();
  now.setSeconds(0, 0);
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    description: "",
    price: "",
    paymentMethod: "Cash",
    purchasedAt: localIso,
  };
}

const EMPTY_PAYER: PayerDetails = { phone: "", upiId: "", notes: "" };

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success"; sentTo: string[] }
  | { status: "error"; message: string };

export function ExpenseTracker() {
  const [items, setItems] = useState<ExpenseLineItem[]>([createEmptyLineItem()]);
  const [payer, setPayer] = useState<PayerDetails>(EMPTY_PAYER);
  const [hydrated, setHydrated] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "generating" | "error">("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [recipientsInput, setRecipientsInput] = useState("");
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount only. This is a one-time load of external state (not a
  // reactive sync loop), so the batched setState calls here are intentional and safe.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.items.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration on mount, not a reactive sync loop
      setItems(draft.items);
      setPayer(draft.payer);
    }
    setHydrated(true);
     
  }, []);

  // Debounced autosave.
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveDraft({ items, payer });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [items, payer, hydrated]);

  const total = useMemo(() => calculateTotal(items), [items]);
  const validItems = useMemo(() => getValidLineItems(items), [items]);
  const canGenerate = validItems.length > 0;

  const updateItem = useCallback((id: string, patch: Partial<ExpenseLineItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyLineItem()]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloadState("generating");
    setDownloadError(null);
    const result = await generateExpensePdf(items, payer);
    if (result.status === "error") {
      setDownloadState("error");
      setDownloadError(result.message);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadState("idle");
  }, [items, payer]);

  const { valid: recipientPreview, invalid: recipientInvalidPreview } = useMemo(
    () => validateRecipients(recipientsInput),
    [recipientsInput],
  );

  const handleSendEmail = useCallback(async () => {
    if (recipientPreview.length === 0) {
      setSendState({
        status: "error",
        message: "Enter at least one valid recipient email address.",
      });
      return;
    }
    if (recipientInvalidPreview.length > 0) {
      setSendState({
        status: "error",
        message: `Fix these invalid email addresses: ${recipientInvalidPreview.join(", ")}`,
      });
      return;
    }
    setSendState({ status: "sending" });
    try {
      const response = await fetch("/api/send-expense-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, payer, recipients: recipientPreview }),
      });
      const data: { error?: string; sentTo?: string[] } = await response.json();
      if (!response.ok) {
        setSendState({ status: "error", message: data.error || "Failed to send the email." });
        return;
      }
      setSendState({ status: "success", sentTo: data.sentTo ?? recipientPreview });
    } catch {
      setSendState({ status: "error", message: "Network error - please check your connection and try again." });
    }
  }, [items, payer, recipientPreview, recipientInvalidPreview]);

  return (
    <div id="tracker" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="card p-4 sm:p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Line items</h2>
            <p className="mt-1 text-sm text-slate-500">Add every item you bought, with its price, payment method, and time.</p>
          </div>
          <button type="button" onClick={addItem} className="btn-secondary shrink-0 !px-4 !py-2 text-sm">
            <Plus className="h-4 w-4" aria-hidden />
            Add item
          </button>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Item / description</th>
                <th className="px-3 py-2">Price ({CURRENCY_SYMBOL})</th>
                <th className="px-3 py-2">Payment method</th>
                <th className="px-3 py-2">Date &amp; time</th>
                <th className="px-3 py-2 text-right">Remove</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const priceInvalid = item.price !== "" && !(Number(item.price) > 0);
                return (
                  <tr key={item.id} className="rounded-lg bg-slate-50">
                    <td className="rounded-l-lg px-3 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        placeholder="e.g. Tomatoes, 2 kg"
                        className="w-full min-w-[10rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: e.target.value })}
                        placeholder="0.00"
                        aria-invalid={priceInvalid}
                        className={`w-24 rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 ${
                          priceInvalid
                            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                            : "border-slate-200 focus:border-accent focus:ring-accent/20"
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={item.paymentMethod}
                        onChange={(e) =>
                          updateItem(item.id, { paymentMethod: e.target.value as ExpenseLineItem["paymentMethod"] })
                        }
                        className="w-full min-w-[8.5rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="datetime-local"
                        value={item.purchasedAt}
                        onChange={(e) => updateItem(item.id, { purchasedAt: e.target.value })}
                        className="w-full min-w-[11rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </td>
                    <td className="rounded-r-lg px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        aria-label="Remove line item"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm font-medium text-slate-500">Total</span>
          <span className="text-xl font-bold text-slate-900">
            {CURRENCY_SYMBOL}
            {total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="card mt-6 p-4 sm:p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Payment details (optional)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Shown on the PDF so whoever receives it knows how to pay you back.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Phone number</span>
            <input
              type="tel"
              value={payer.phone}
              onChange={(e) => setPayer((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">UPI ID</span>
            <input
              type="text"
              value={payer.upiId}
              onChange={(e) => setPayer((prev) => ({ ...prev, upiId: e.target.value }))}
              placeholder="yourname@upi"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Notes</span>
            <textarea
              value={payer.notes}
              onChange={(e) => setPayer((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any extra context, e.g. split 3 ways, pay by Friday..."
              rows={3}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      </div>

      <div className="card mt-6 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Download your PDF</h2>
            <p className="mt-1 text-sm text-slate-500">
              {canGenerate ? "Get a clean, professional record of this expense." : "Add at least one complete line item to enable this."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!canGenerate || downloadState === "generating"}
            className="btn-primary shrink-0"
          >
            {downloadState === "generating" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" aria-hidden />
            )}
            Download PDF
          </button>
        </div>
        {downloadState === "error" && downloadError && (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {downloadError}
          </p>
        )}
      </div>

      <div className="card mt-6 p-4 sm:p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Send via email</h2>
        <p className="mt-1 text-sm text-slate-500">
          Email the same PDF to one or more people. Separate multiple addresses with commas or new lines.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <textarea
            value={recipientsInput}
            onChange={(e) => setRecipientsInput(e.target.value)}
            placeholder="friend@example.com, another@example.com"
            rows={2}
            className="flex-1 resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={!canGenerate || sendState.status === "sending" || recipientsInput.trim().length === 0}
            className="btn-primary shrink-0"
          >
            {sendState.status === "sending" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Mail className="h-4 w-4" aria-hidden />
            )}
            Send email
          </button>
        </div>
        {sendState.status === "success" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            Sent to {sendState.sentTo.join(", ")}.
          </p>
        )}
        {sendState.status === "error" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {sendState.message}
          </p>
        )}
      </div>
    </div>
  );
}
