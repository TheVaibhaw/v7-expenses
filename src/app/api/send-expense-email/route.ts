import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { ExpenseReportDocument } from "@/components/pdf/ExpenseReportDocument";
import { validateRecipients, getValidLineItems } from "@/lib/validation";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { ExpenseLineItem, PayerDetails } from "@/lib/types";

// Resend's SDK and @react-pdf/renderer's Node rendering APIs need the Node.js runtime,
// not the Edge runtime.
export const runtime = "nodejs";

interface RequestBody {
  items?: unknown;
  payer?: unknown;
  recipients?: unknown;
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

function parsePayer(raw: unknown): PayerDetails {
  if (typeof raw !== "object" || raw === null) return { phone: "", upiId: "", notes: "" };
  const candidate = raw as Record<string, unknown>;
  return {
    phone: typeof candidate.phone === "string" ? candidate.phone : "",
    upiId: typeof candidate.upiId === "string" ? candidate.upiId : "",
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
  };
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

  const items = parseLineItems(body.items);
  if (!items) {
    return NextResponse.json({ error: "Invalid or missing line items." }, { status: 400 });
  }

  const validItems = getValidLineItems(items);
  if (validItems.length === 0) {
    return NextResponse.json(
      { error: "Add at least one complete line item (description, price, and date) before sending." },
      { status: 400 },
    );
  }

  const payer = parsePayer(body.payer);

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
    pdfBuffer = await renderToBuffer(ExpenseReportDocument({ items, payer }));
  } catch {
    return NextResponse.json({ error: "Failed to generate the PDF. Please try again." }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: "Your Expense Report",
      html: `<p>Hi,</p><p>Please find attached your expense report, generated with The V7 Ninja Expense Tracker.</p><p>Total items: ${validItems.length}</p>`,
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
