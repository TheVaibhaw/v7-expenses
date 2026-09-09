import type { PaymentMethod } from "./constants";

export interface ExpenseLineItem {
  id: string;
  description: string;
  /** Price as a string while being edited; parsed/validated to a number before use. */
  price: string;
  paymentMethod: PaymentMethod;
  /** ISO 8601 datetime-local value, e.g. "2026-09-09T14:30". */
  purchasedAt: string;
}

export interface PayerDetails {
  phone: string;
  upiId: string;
  notes: string;
}

export interface ExpenseDraft {
  items: ExpenseLineItem[];
  payer: PayerDetails;
}

export interface SendExpenseEmailRequest {
  items: ExpenseLineItem[];
  payer: PayerDetails;
  recipients: string[];
}
