import type { ExpenseGroup, ExpenseLineItem, SplitPerson } from "./types";
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

/** A split person counts once they have a non-empty (trimmed) name. */
export function isSplitPersonComplete(person: SplitPerson): boolean {
  return person.name.trim().length > 0;
}

export function getValidSplitPeople(people: SplitPerson[]): SplitPerson[] {
  return people.filter(isSplitPersonComplete);
}

/** A total can be split once at least MIN_SPLIT_PEOPLE named people are present. */
export function isValidSplitCount(people: SplitPerson[]): boolean {
  return getValidSplitPeople(people).length >= MIN_SPLIT_PEOPLE;
}

export interface SplitPersonShare {
  id: string;
  name: string;
  amount: number;
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
  /** Per-person breakdown, in the order the people were entered. */
  shares: SplitPersonShare[];
}

/**
 * Splits `total` equally among the named `people`, distributing any leftover paisa/cent to the
 * first `extraCount` people (who each pay one currency-minor-unit more) so the shares always sum
 * exactly to the total, rather than silently losing a cent to rounding (e.g. ₹100 / 3 people:
 * 2 people pay ₹33.34, 1 person pays ₹33.33 - not "everyone pays ₹33.33, ₹0.01 short").
 */
export function computeSplitShare(total: number, people: SplitPerson[]): SplitShare | null {
  const validPeople = getValidSplitPeople(people);
  if (!isValidSplitCount(people) || !(total > 0)) return null;
  const count = validPeople.length;
  const totalMinorUnits = Math.round(total * 100);
  const baseMinorUnits = Math.floor(totalMinorUnits / count);
  const extraCount = totalMinorUnits - baseMinorUnits * count;
  const baseAmount = baseMinorUnits / 100;
  const higherAmount = (baseMinorUnits + 1) / 100;
  const shares: SplitPersonShare[] = validPeople.map((person, index) => ({
    id: person.id,
    name: person.name.trim(),
    amount: index < extraCount ? higherAmount : baseAmount,
  }));
  return {
    baseAmount,
    higherAmount,
    extraCount,
    people: count,
    total: totalMinorUnits / 100,
    shares,
  };
}
