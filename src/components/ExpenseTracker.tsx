"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Plus,
  Trash2,
  Download,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Wallet,
  Receipt,
  ClipboardList,
} from "lucide-react";
import { AUTOSAVE_DEBOUNCE_MS, CURRENCIES, DEFAULT_CURRENCY, MIN_SPLIT_PEOPLE, PAYMENT_METHODS } from "@/lib/constants";
import { loadDraft, saveDraft } from "@/lib/storage";
import type { Currency, ExpenseGroup, ExpenseLineItem, PayerDetails, SplitConfig } from "@/lib/types";
import {
  calculateGrandTotal,
  calculateGroupTotal,
  computeSplitShare,
  getValidGroups,
  getValidLineItems,
  isValidSplitCount,
  validateRecipients,
} from "@/lib/validation";
import { generateExpensePdf } from "@/lib/generate-expense-pdf";

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function createEmptyLineItem(): ExpenseLineItem {
  const now = new Date();
  now.setSeconds(0, 0);
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return {
    id: randomId(),
    description: "",
    price: "",
    paymentMethod: "Cash",
    purchasedAt: localIso,
  };
}

function createEmptyGroup(name = ""): ExpenseGroup {
  return { id: randomId(), name, items: [createEmptyLineItem()] };
}

const EMPTY_PAYER: PayerDetails = { phone: "", upiId: "", notes: "" };
const EMPTY_SPLIT: SplitConfig = { enabled: false, people: "" };

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success"; sentTo: string[] }
  | { status: "error"; message: string };

export function ExpenseTracker() {
  const [groups, setGroups] = useState<ExpenseGroup[]>([createEmptyGroup()]);
  const [payer, setPayer] = useState<PayerDetails>(EMPTY_PAYER);
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const [split, setSplit] = useState<SplitConfig>(EMPTY_SPLIT);
  const [hydrated, setHydrated] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "generating" | "error">("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [recipientsInput, setRecipientsInput] = useState("");
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

  // Hydrate from localStorage on mount only. This is a one-time load of external state (not a
  // reactive sync loop), so the batched setState calls here are intentional and safe.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.groups.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration on mount, not a reactive sync loop
      setGroups(draft.groups);
      setPayer(draft.payer);
      setCurrency(draft.currency);
      setSplit(draft.split);
    }
    setHydrated(true);

  }, []);

  // Debounced autosave.
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveDraft({ groups, payer, currency, split });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [groups, payer, currency, split, hydrated]);

  const grandTotal = useMemo(() => calculateGrandTotal(groups), [groups]);
  const validGroups = useMemo(() => getValidGroups(groups), [groups]);
  const canGenerate = validGroups.length > 0;
  // Several countries share a currency code (e.g. the Eurozone) - the dropdown is keyed by the
  // per-country `id`, so resolve which option to show as selected from the current code alone
  // (deterministically the first country in the list using that currency).
  const selectedCurrencyId = useMemo(
    () => CURRENCIES.find((c) => c.code === currency.code)?.id ?? CURRENCIES[0].id,
    [currency.code],
  );

  const updateGroupName = useCallback((groupId: string, name: string) => {
    setGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, name } : group)));
  }, []);

  const updateItem = useCallback((groupId: string, itemId: string, patch: Partial<ExpenseLineItem>) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, items: group.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) }
          : group,
      ),
    );
  }, []);

  const addItem = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, items: [...group.items, createEmptyLineItem()] } : group)),
    );
  }, []);

  const removeItem = useCallback((groupId: string, itemId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, items: group.items.length === 1 ? group.items : group.items.filter((item) => item.id !== itemId) }
          : group,
      ),
    );
  }, []);

  const addGroup = useCallback(() => {
    setGroups((prev) => [...prev, createEmptyGroup()]);
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setGroups((prev) => (prev.length === 1 ? prev : prev.filter((group) => group.id !== groupId)));
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloadState("generating");
    setDownloadError(null);
    const result = await generateExpensePdf(groups, payer, currency, split);
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
  }, [groups, payer, currency, split]);

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
        body: JSON.stringify({ groups, payer, currency, split, recipients: recipientPreview }),
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
  }, [groups, payer, currency, split, recipientPreview, recipientInvalidPreview]);

  // Split validation: number of people must be an integer >= MIN_SPLIT_PEOPLE, and the split
  // option only makes sense once there's a positive grand total.
  const splitPeopleTouched = split.people.trim().length > 0;
  const splitCountValid = !splitPeopleTouched || isValidSplitCount(split.people);
  const splitShare = split.enabled && grandTotal > 0 ? computeSplitShare(grandTotal, Number(split.people)) : null;
  const splitErrorMessage =
    split.enabled && splitPeopleTouched && !splitCountValid
      ? `Number of people must be a whole number of at least ${MIN_SPLIT_PEOPLE}.`
      : null;

  const fadeUp = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  return (
    <div id="tracker" className="relative">
      <div
        aria-hidden
        className="glow-blob animate-float-slow pointer-events-none absolute -top-10 right-0 h-64 w-64 rounded-full bg-accent/20 sm:h-80 sm:w-80"
      />

      <div className="relative mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Track an expense</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
          Add what you bought, pick a currency, split the bill if you need to, then download or email a
          clean PDF record.
        </p>
      </div>

      {/* Sticky summary bar */}
      <div className="sticky top-0 z-20 mt-6 border-y border-slate-200/70 bg-background/85 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <select
              value={selectedCurrencyId}
              onChange={(e) => {
                const match = CURRENCIES.find((c) => c.id === e.target.value);
                if (match) setCurrency({ code: match.code, symbol: match.symbol });
              }}
              aria-label="Currency (by country)"
              className="max-w-[14rem] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {CURRENCIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.country} &middot; {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-1.5">
            <span className="text-xs font-medium text-slate-600 sm:text-sm">
              Grand total &middot; {validGroups.length} group{validGroups.length === 1 ? "" : "s"}
            </span>
            <span className="text-base font-bold text-accent sm:text-lg">
              {currency.symbol}
              {grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 sm:pb-14">
        <AnimatePresence initial={false}>
          {groups.map((group, groupIndex) => {
            const groupTotal = calculateGroupTotal(group);
            const validItemCount = getValidLineItems(group.items).length;
            return (
              <motion.div
                key={group.id}
                layout={reduceMotion ? undefined : "position"}
                {...fadeUp}
                transition={{ duration: 0.25 }}
                className="relative mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white pl-1 shadow-lg shadow-slate-200/50"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent to-accent/40" aria-hidden />
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                        {groupIndex + 1}
                      </span>
                      <label className="block flex-1 text-sm">
                        <span className="mb-1 block font-medium text-slate-700">Group name</span>
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => updateGroupName(group.id, e.target.value)}
                          placeholder="e.g. Market, Mall, Groceries"
                          className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                        />
                      </label>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                      <button type="button" onClick={() => addItem(group.id)} className="btn-secondary !px-4 !py-2 text-sm">
                        <Plus className="h-4 w-4" aria-hidden />
                        Add item
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGroup(group.id)}
                        disabled={groups.length === 1}
                        aria-label="Remove group"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>

                  {/* Line items: stacked cards on mobile, table from sm: up */}
                  <div className="hidden -mx-4 overflow-x-auto px-4 sm:mx-0 sm:block sm:px-0">
                    <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2">Item / description</th>
                          <th className="px-3 py-2">Price ({currency.symbol})</th>
                          <th className="px-3 py-2">Payment method</th>
                          <th className="px-3 py-2">Date &amp; time</th>
                          <th className="px-3 py-2 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => {
                          const priceInvalid = item.price !== "" && !(Number(item.price) > 0);
                          return (
                            <tr key={item.id} className="rounded-lg bg-slate-50">
                              <td className="rounded-l-lg px-3 py-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(group.id, item.id, { description: e.target.value })}
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
                                  onChange={(e) => updateItem(group.id, item.id, { price: e.target.value })}
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
                                    updateItem(group.id, item.id, {
                                      paymentMethod: e.target.value as ExpenseLineItem["paymentMethod"],
                                    })
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
                                  onChange={(e) => updateItem(group.id, item.id, { purchasedAt: e.target.value })}
                                  className="w-full min-w-[11rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                              </td>
                              <td className="rounded-r-lg px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItem(group.id, item.id)}
                                  disabled={group.items.length === 1}
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

                  {/* Mobile: stacked line-item cards */}
                  <div className="space-y-3 sm:hidden">
                    <AnimatePresence initial={false}>
                      {group.items.map((item, itemIndex) => {
                        const priceInvalid = item.price !== "" && !(Number(item.price) > 0);
                        return (
                          <motion.div
                            key={item.id}
                            {...fadeUp}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Item {itemIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeItem(group.id, item.id)}
                                disabled={group.items.length === 1}
                                aria-label="Remove line item"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                            <div className="space-y-2.5">
                              <label className="block text-sm">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Item / description</span>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateItem(group.id, item.id, { description: e.target.value })}
                                  placeholder="e.g. Tomatoes, 2 kg"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                              </label>
                              <div className="grid grid-cols-2 gap-2.5">
                                <label className="block text-sm">
                                  <span className="mb-1 block text-xs font-medium text-slate-500">Price ({currency.symbol})</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) => updateItem(group.id, item.id, { price: e.target.value })}
                                    placeholder="0.00"
                                    aria-invalid={priceInvalid}
                                    className={`w-full rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 ${
                                      priceInvalid
                                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                        : "border-slate-200 focus:border-accent focus:ring-accent/20"
                                    }`}
                                  />
                                </label>
                                <label className="block text-sm">
                                  <span className="mb-1 block text-xs font-medium text-slate-500">Payment method</span>
                                  <select
                                    value={item.paymentMethod}
                                    onChange={(e) =>
                                      updateItem(group.id, item.id, {
                                        paymentMethod: e.target.value as ExpenseLineItem["paymentMethod"],
                                      })
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                  >
                                    {PAYMENT_METHODS.map((method) => (
                                      <option key={method} value={method}>
                                        {method}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                              <label className="block text-sm">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Date &amp; time</span>
                                <input
                                  type="datetime-local"
                                  value={item.purchasedAt}
                                  onChange={(e) => updateItem(group.id, item.id, { purchasedAt: e.target.value })}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                                />
                              </label>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">
                      {validItemCount} valid item{validItemCount === 1 ? "" : "s"}
                      {group.name.trim().length === 0 && " · name this group to include it in the total"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500">Subtotal</span>
                      <span className="text-lg font-bold text-slate-900">
                        {currency.symbol}
                        {groupTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div className="mt-6 flex justify-center">
          <button type="button" onClick={addGroup} className="btn-secondary !px-4 !py-2 text-sm">
            <Plus className="h-4 w-4" aria-hidden />
            Add group
          </button>
        </div>

        <div className="card mt-6 p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Receipt className="h-4 w-4" aria-hidden />
            </span>
            <div className="flex flex-1 items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Grand total ({validGroups.length} group{validGroups.length === 1 ? "" : "s"})
              </span>
              <span className="text-xl font-bold text-slate-900">
                {currency.symbol}
                {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={split.enabled}
                disabled={grandTotal <= 0}
                onChange={(e) => setSplit((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30"
              />
              <Users className="h-4 w-4 text-slate-400" aria-hidden />
              Split this expense
            </label>
            {grandTotal <= 0 && (
              <p className="mt-1 text-xs text-slate-400">
                Add at least one complete, named group with a valid item before you can split the total.
              </p>
            )}

            {split.enabled && grandTotal > 0 && (
              <div className="mt-3">
                <label className="block text-sm sm:max-w-xs">
                  <span className="mb-1 block font-medium text-slate-700">Number of people</span>
                  <input
                    type="number"
                    min={MIN_SPLIT_PEOPLE}
                    step="1"
                    value={split.people}
                    onChange={(e) => setSplit((prev) => ({ ...prev, people: e.target.value }))}
                    placeholder={String(MIN_SPLIT_PEOPLE)}
                    aria-invalid={Boolean(splitErrorMessage)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 ${
                      splitErrorMessage
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-accent focus:ring-accent/20"
                    }`}
                  />
                </label>
                {splitErrorMessage && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                    {splitErrorMessage}
                  </p>
                )}

                {splitShare && (
                  <div className="mt-4 rounded-xl border border-accent/20 bg-accent-soft p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Split Summary</h3>
                    {splitShare.extraCount === 0 ? (
                      <p className="mt-1 text-sm text-slate-700">
                        Total: {currency.symbol}
                        {splitShare.total.toFixed(2)} &middot; Split {splitShare.people} ways &middot;{" "}
                        <span className="font-semibold text-accent">
                          {currency.symbol}
                          {splitShare.baseAmount.toFixed(2)} per person
                        </span>
                      </p>
                    ) : (
                      <>
                        <p className="mt-1 text-sm text-slate-700">
                          Total: {currency.symbol}
                          {splitShare.total.toFixed(2)} &middot; Split {splitShare.people} ways
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {splitShare.extraCount} person{splitShare.extraCount === 1 ? "" : "s"} pay{" "}
                          <span className="font-semibold text-accent">
                            {currency.symbol}
                            {splitShare.higherAmount.toFixed(2)}
                          </span>
                          , {splitShare.people - splitShare.extraCount} person
                          {splitShare.people - splitShare.extraCount === 1 ? "" : "s"} pay{" "}
                          <span className="font-semibold text-accent">
                            {currency.symbol}
                            {splitShare.baseAmount.toFixed(2)}
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          The total doesn&apos;t divide evenly, so the extra paisa/cent is distributed to a few people
                          instead of being rounded away - shares always add up exactly to the total.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card mt-6 p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Wallet className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Payment details (optional)</h2>
              <p className="mt-1 text-sm text-slate-500">
                Shown on the PDF so whoever receives it knows how to pay you back.
              </p>
            </div>
          </div>
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
                {canGenerate ? "Get a clean, professional record of this expense." : "Add at least one named group with a complete line item to enable this."}
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
    </div>
  );
}
