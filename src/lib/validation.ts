import type { ExpenseGroup, ExpenseLineItem } from "./types";
import { MIN_SPLIT_PEOPLE } from "./constants";

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

/** A group counts for totals/export purposes only once it has a name and at least one valid item. */
export function isGroupValid(group: ExpenseGroup): boolean {
  return group.name.trim().length > 0 && getValidLineItems(group.items).length > 0;
}

export function getValidGroups(groups: ExpenseGroup[]): ExpenseGroup[] {
  return groups.filter(isGroupValid);
}

export function calculateGroupTotal(group: ExpenseGroup): number {
  return calculateTotal(group.items);
}

/** Grand total across every valid group's valid line items. */
export function calculateGrandTotal(groups: ExpenseGroup[]): number {
  return getValidGroups(groups).reduce((sum, group) => sum + calculateGroupTotal(group), 0);
}

/** Number of people a total can be split among: a positive integer of at least MIN_SPLIT_PEOPLE. */
export function isValidSplitCount(value: string | number): boolean {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isInteger(num) && num >= MIN_SPLIT_PEOPLE;
}

export interface SplitShare {
  /** The amount most people pay (in currency units, 2dp). */
  baseAmount: number;
  /** The amount `extraCount` people pay when the total doesn't divide evenly (baseAmount + 0.01). */
  higherAmount: number;
  /** How many people pay `higherAmount` instead of `baseAmount`. */
  extraCount: number;
  /** Total number of people. */
  people: number;
  /** Sum of all shares - always exactly equal to the (rounded-to-cents) total. */
  total: number;
}

/**
 * Splits `total` equally among `people`, distributing any leftover paisa/cent to the first
 * `extraCount` people (who each pay one currency-minor-unit more) so the shares always sum
 * exactly to the total, rather than silently losing a cent to rounding (e.g. ₹100 / 3 people:
 * 2 people pay ₹33.34, 1 person pays ₹33.33 - not "everyone pays ₹33.33, ₹0.01 short").
 */
export function computeSplitShare(total: number, people: number): SplitShare | null {
  if (!isValidSplitCount(people) || !(total > 0)) return null;
  const totalMinorUnits = Math.round(total * 100);
  const baseMinorUnits = Math.floor(totalMinorUnits / people);
  const extraCount = totalMinorUnits - baseMinorUnits * people;
  return {
    baseAmount: baseMinorUnits / 100,
    higherAmount: (baseMinorUnits + 1) / 100,
    extraCount,
    people,
    total: totalMinorUnits / 100,
  };
}
