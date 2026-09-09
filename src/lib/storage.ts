import type { Currency, ExpenseDraft, ExpenseGroup, ExpenseLineItem, PayerDetails, SplitConfig, SplitPerson } from "./types";
import { CURRENCIES, DEFAULT_CURRENCY, PAYMENT_METHODS } from "./constants";
import { isValidQrDataUrl } from "./validation";

const DRAFT_STORAGE_KEY = "v7-expenses:draft";

function isPaymentMethod(value: unknown): value is (typeof PAYMENT_METHODS)[number] {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
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

function sanitizeGroup(candidate: unknown): ExpenseGroup | null {
  if (typeof candidate !== "object" || candidate === null) return null;
  const group = candidate as Record<string, unknown>;
  if (typeof group.id !== "string" || typeof group.name !== "string") return null;
  const items = Array.isArray(group.items)
    ? group.items.map(sanitizeLineItem).filter((item): item is ExpenseLineItem => item !== null)
    : [];
  return { id: group.id, name: group.name, items };
}

function sanitizePayer(candidate: unknown): PayerDetails {
  if (typeof candidate !== "object" || candidate === null) {
    return { phone: "", upiId: "", notes: "", qrCodeImage: null };
  }
  const payer = candidate as Record<string, unknown>;
  const qrCodeImage = typeof payer.qrCodeImage === "string" && isValidQrDataUrl(payer.qrCodeImage) ? payer.qrCodeImage : null;
  return {
    phone: typeof payer.phone === "string" ? payer.phone : "",
    upiId: typeof payer.upiId === "string" ? payer.upiId : "",
    notes: typeof payer.notes === "string" ? payer.notes : "",
    qrCodeImage,
  };
}

function sanitizeCurrency(candidate: unknown): Currency {
  if (typeof candidate !== "object" || candidate === null) return DEFAULT_CURRENCY;
  const currency = candidate as Record<string, unknown>;
  const match = CURRENCIES.find((c) => c.code === currency.code);
  return match ?? DEFAULT_CURRENCY;
}

function sanitizeSplitPerson(candidate: unknown): SplitPerson | null {
  if (typeof candidate !== "object" || candidate === null) return null;
  const person = candidate as Record<string, unknown>;
  if (typeof person.id !== "string" || typeof person.name !== "string") return null;
  return { id: person.id, name: person.name, isSelf: person.isSelf === true };
}

/**
 * Handles both the current shape (`people: SplitPerson[]`) and the old one from before named
 * splitting existed (`people: string`, a head-count) - an old draft's count is discarded rather
 * than guessed at as blank-named people, since a bare number can't be turned into real names.
 * Also enforces "at most one `isSelf`" defensively, in case a corrupted/hand-edited draft has
 * more than one - keeps the first and clears the rest, rather than trusting all of them.
 */
function sanitizeSplit(candidate: unknown): SplitConfig {
  if (typeof candidate !== "object" || candidate === null) return { enabled: false, people: [] };
  const split = candidate as Record<string, unknown>;
  const enabled = typeof split.enabled === "boolean" ? split.enabled : false;
  if (Array.isArray(split.people)) {
    const people = split.people.map(sanitizeSplitPerson).filter((p): p is SplitPerson => p !== null);
    let seenSelf = false;
    for (const person of people) {
      if (person.isSelf) {
        if (seenSelf) person.isSelf = false;
        seenSelf = true;
      }
    }
    return { enabled, people };
  }
  return { enabled: false, people: [] };
}

/**
 * Loads and validates the saved draft. Returns null for a missing or structurally invalid
 * draft rather than throwing - a bad localStorage value should never crash the app, it should
 * just fall back to starting fresh. Also handles migrating away from the old flat `items` shape
 * (pre-groups) that may still be sitting in a returning user's browser: it gets wrapped into a
 * single default group rather than crashing or silently losing their data.
 */
export function loadDraft(): ExpenseDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as { groups?: unknown; items?: unknown; payer?: unknown; currency?: unknown; split?: unknown };

    let groups: ExpenseGroup[];
    if (Array.isArray(candidate.groups)) {
      groups = candidate.groups.map(sanitizeGroup).filter((group): group is ExpenseGroup => group !== null);
    } else if (Array.isArray(candidate.items)) {
      // Old shape: a flat items array from before groups existed. Migrate into one group.
      const items = candidate.items.map(sanitizeLineItem).filter((item): item is ExpenseLineItem => item !== null);
      groups = items.length > 0 ? [{ id: randomId(), name: "Expenses", items }] : [];
    } else {
      groups = [];
    }

    return {
      groups,
      payer: sanitizePayer(candidate.payer),
      currency: sanitizeCurrency(candidate.currency),
      split: sanitizeSplit(candidate.split),
    };
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
