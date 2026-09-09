import type { ExpenseLineItem } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

/** Splits a comma- or newline-separated recipients string into trimmed, deduped emails. */
export function parseRecipients(raw: string): string[] {
  const parts = raw
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return Array.from(new Set(parts));
}

export function validateRecipients(raw: string): { valid: string[]; invalid: string[] } {
  const recipients = parseRecipients(raw);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const email of recipients) {
    if (isValidEmail(email)) valid.push(email);
    else invalid.push(email);
  }
  return { valid, invalid };
}

export function isPositivePrice(price: string): boolean {
  const value = Number(price);
  return Number.isFinite(value) && value > 0;
}

export function isLineItemComplete(item: ExpenseLineItem): boolean {
  return item.description.trim().length > 0 && isPositivePrice(item.price) && item.purchasedAt.trim().length > 0;
}

export function getValidLineItems(items: ExpenseLineItem[]): ExpenseLineItem[] {
  return items.filter(isLineItemComplete);
}

export function calculateTotal(items: ExpenseLineItem[]): number {
  return getValidLineItems(items).reduce((sum, item) => sum + Number(item.price), 0);
}
