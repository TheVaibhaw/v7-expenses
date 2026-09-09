import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { ExpenseReportDocument } from "@/components/pdf/ExpenseReportDocument";
import { registerPdfFonts } from "@/lib/pdf-fonts";
import { validateRecipients, getValidGroups, isValidSplitCount, calculateGrandTotal } from "@/lib/validation";
import { CURRENCIES, DEFAULT_CURRENCY, PAYMENT_METHODS } from "@/lib/constants";
import type { Currency, ExpenseGroup, ExpenseLineItem, PayerDetails, SplitConfig, SplitPerson } from "@/lib/types";

// Resend's SDK and @react-pdf/renderer's Node rendering APIs need the Node.js runtime,
// not the Edge runtime.
export const runtime = "nodejs";

interface RequestBody {
  groups?: unknown;
  payer?: unknown;
  recipients?: unknown;
  currency?: unknown;
  split?: unknown;
}

function isPaymentMethod(value: unknown): value is (typeof PAYMENT_METHODS)[number] {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

function parseLineItems(raw: unknown): ExpenseLineItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: ExpenseLineItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return null;
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.description !== "string" ||
      typeof candidate.price !== "string" ||
      typeof candidate.purchasedAt !== "string" ||
      !isPaymentMethod(candidate.paymentMethod)
    ) {
      return null;
    }
    items.push({
      id: candidate.id,
      description: candidate.description,
      price: candidate.price,
      paymentMethod: candidate.paymentMethod,
      purchasedAt: candidate.purchasedAt,
    });
  }
  return items;
}

function parseGroups(raw: unknown): ExpenseGroup[] | null {
  if (!Array.isArray(raw)) return null;
  const groups: ExpenseGroup[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return null;
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.id !== "string" || typeof candidate.name !== "string") return null;
    const items = parseLineItems(candidate.items);
    if (!items) return null;
    groups.push({ id: candidate.id, name: candidate.name, items });
  }
  return groups;
}

function parsePayer(raw: unknown): PayerDetails {
  if (typeof raw !== "object" || raw === null) return { phone: "", upiId: "", notes: "" };
  const candidate = raw as Record<string, unknown>;
  return {
    phone: typeof candidate.phone === "string" ? candidate.phone : "",
    upiId: typeof candidate.upiId === "string" ? candidate.upiId : "",
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
  };
}

function parseCurrency(raw: unknown): Currency {
  if (typeof raw !== "object" || raw === null) return DEFAULT_CURRENCY;
  const candidate = raw as Record<string, unknown>;
  const match = CURRENCIES.find((c) => c.code === candidate.code);
  return match ?? DEFAULT_CURRENCY;
}

function parseSplitPerson(raw: unknown): SplitPerson | null {
  if (typeof raw !== "object" || raw === null) return null;
  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.id !== "string" || typeof candidate.name !== "string") return null;
  return { id: candidate.id, name: candidate.name };
}

/**
 * Split state is never trusted from the client as-is: `enabled` must be a boolean and, when
 * enabled, `people` must independently pass `isValidSplitCount` server-side too (same rule the
 * UI enforces - at least MIN_SPLIT_PEOPLE non-blank names), and the grand total must be
 * positive - otherwise split is treated as off.
 */
function parseSplit(raw: unknown, grandTotal: number): SplitConfig {
  const disabled: SplitConfig = { enabled: false, people: [] };
  if (typeof raw !== "object" || raw === null) return disabled;
  const candidate = raw as Record<string, unknown>;
  if (candidate.enabled !== true) return disabled;
  if (!Array.isArray(candidate.people)) return disabled;
  const people = candidate.people.map(parseSplitPerson).filter((p): p is SplitPerson => p !== null);
  if (!grandTotal || grandTotal <= 0) return disabled;
  if (!isValidSplitCount(people)) return disabled;
  return { enabled: true, people };
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Email sending is not configured on this server: RESEND_API_KEY is not set. Set it as an environment variable and restart the app.",
      },
      { status: 500 },
    );
  }

  if (!fromEmail) {
    return NextResponse.json(
      {
        error:
          "Email sending is not configured on this server: RESEND_FROM_EMAIL is not set. Set it to a sender address on a domain verified in your Resend dashboard.",
      },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body: expected JSON." }, { status: 400 });
  }

  const groups = parseGroups(body.groups);
  if (!groups) {
    return NextResponse.json({ error: "Invalid or missing expense groups." }, { status: 400 });
  }

  const validGroups = getValidGroups(groups);
  if (validGroups.length === 0) {
    return NextResponse.json(
      {
        error:
          "Add at least one group with a name and one complete line item (description, price, and date) before sending.",
      },
      { status: 400 },
    );
  }

  const payer = parsePayer(body.payer);
  const currency = parseCurrency(body.currency);
  const grandTotal = calculateGrandTotal(groups);
  const split = parseSplit(body.split, grandTotal);

  if (!Array.isArray(body.recipients) || body.recipients.some((r) => typeof r !== "string")) {
    return NextResponse.json({ error: "Invalid recipients: expected a list of email addresses." }, { status: 400 });
  }

  const { valid: recipients, invalid } = validateRecipients((body.recipients as string[]).join(","));

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No valid recipient email addresses were provided." },
      { status: 400 },
    );
  }

  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `The following recipient email address${invalid.length > 1 ? "es are" : " is"} invalid: ${invalid.join(", ")}` },
      { status: 400 },
    );
  }

  let pdfBuffer: Buffer;
  try {
    registerPdfFonts();
    pdfBuffer = await renderToBuffer(ExpenseReportDocument({ groups, payer, currency, split }));
  } catch {
    return NextResponse.json({ error: "Failed to generate the PDF. Please try again." }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const totalItems = validGroups.reduce((sum, group) => sum + group.items.length, 0);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: "Your Expense Report",
      html: `<p>Hi,</p><p>Please find attached your expense report, generated with The V7 Ninja Expense Tracker.</p><p>Groups: ${validGroups.length} &middot; Total items: ${totalItems}</p>`,
      attachments: [
        {
          filename: "expense-report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Resend failed to send the email." }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to send the email. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ success: true, sentTo: recipients });
}
