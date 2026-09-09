import type { PaymentMethod, CurrencyCode } from "./constants";

export interface ExpenseLineItem {
  id: string;
  description: string;
  /** Price as a string while being edited; parsed/validated to a number before use. */
  price: string;
  paymentMethod: PaymentMethod;
  /** ISO 8601 datetime-local value, e.g. "2026-09-09T14:30". */
  purchasedAt: string;
}

/** A named collection of line items, e.g. "Market" or "Mall" - each renders as its own section. */
export interface ExpenseGroup {
  id: string;
  name: string;
  items: ExpenseLineItem[];
}

export interface Currency {
  code: CurrencyCode;
  symbol: string;
}

export interface PayerDetails {
  phone: string;
  upiId: string;
  notes: string;
  /** UPI QR code image, as a data URL (e.g. "data:image/png;base64,..."). Optional. */
  qrCodeImage: string | null;
}

/**
 * One named person the total can be split with. `name` may be blank while being edited.
 * `isSelf` marks which one person (if any) is the one who already paid the full amount - the
 * PDF shows them as "Paid" and everyone else as "Pending". At most one person is ever `isSelf`.
 */
export interface SplitPerson {
  id: string;
  name: string;
  isSelf: boolean;
}

/** Split-the-bill state: a named list of people to divide the grand total between. */
export interface SplitConfig {
  enabled: boolean;
  people: SplitPerson[];
}

export interface ExpenseDraft {
  groups: ExpenseGroup[];
  payer: PayerDetails;
  currency: Currency;
  split: SplitConfig;
}

export interface SendExpenseEmailRequest {
  groups: ExpenseGroup[];
  payer: PayerDetails;
  recipients: string[];
  currency: Currency;
  split: SplitConfig;
}
