import type { ExpenseDraft, ExpenseLineItem, PayerDetails } from "./types";
import { PAYMENT_METHODS } from "./constants";

const DRAFT_STORAGE_KEY = "v7-expenses:draft";

function isPaymentMethod(value: unknown): value is (typeof PAYMENT_METHODS)[number] {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

function sanitizeLineItem(candidate: unknown): ExpenseLineItem | null {
  if (typeof candidate !== "object" || candidate === null) return null;
  const item = candidate as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.description !== "string") return null;
  if (typeof item.price !== "string") return null;
  if (!isPaymentMethod(item.paymentMethod)) return null;
  if (typeof item.purchasedAt !== "string") return null;
  return {
    id: item.id,
    description: item.description,
    price: item.price,
    paymentMethod: item.paymentMethod,
    purchasedAt: item.purchasedAt,
  };
}

function sanitizePayer(candidate: unknown): PayerDetails {
  if (typeof candidate !== "object" || candidate === null) {
    return { phone: "", upiId: "", notes: "" };
  }
  const payer = candidate as Record<string, unknown>;
  return {
    phone: typeof payer.phone === "string" ? payer.phone : "",
    upiId: typeof payer.upiId === "string" ? payer.upiId : "",
    notes: typeof payer.notes === "string" ? payer.notes : "",
  };
}

/**
 * Loads and validates the saved draft. Returns null for a missing or structurally invalid
 * draft rather than throwing - a bad localStorage value should never crash the app, it should
 * just fall back to starting fresh.
 */
export function loadDraft(): ExpenseDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as { items?: unknown; payer?: unknown };
    const items = Array.isArray(candidate.items)
      ? candidate.items.map(sanitizeLineItem).filter((item): item is ExpenseLineItem => item !== null)
      : [];
    return { items, payer: sanitizePayer(candidate.payer) };
  } catch {
    return null;
  }
}

/** Writes the draft to localStorage. Callers are responsible for debouncing frequent writes. */
export function saveDraft(draft: ExpenseDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage may be unavailable (private browsing, quota exceeded). Losing autosave is
    // preferable to crashing the app; the user's in-memory session is unaffected.
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore - see saveDraft.
  }
}
