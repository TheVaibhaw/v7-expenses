import type { ExpenseLineItem, PayerDetails } from "./types";

export type PdfGenerationResult =
  | { status: "success"; blob: Blob }
  | { status: "error"; message: string };

const GENERIC_ERROR_MESSAGE = "Something went wrong while generating your PDF. Please try again.";

/**
 * Client-side PDF generation. `@react-pdf/renderer` is dynamically imported since it is a
 * large dependency only needed once someone actually downloads a PDF - keeps it out of the
 * initial page bundle. Uses `pdf(...).toBlob()`, the browser-safe API; the API route uses
 * `renderToBuffer` instead, which is the Node-only counterpart.
 */
export async function generateExpensePdf(
  items: ExpenseLineItem[],
  payer: PayerDetails,
): Promise<PdfGenerationResult> {
  try {
    const [{ pdf }, { ExpenseReportDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/ExpenseReportDocument"),
    ]);

    const blob = await pdf(<ExpenseReportDocument items={items} payer={payer} />).toBlob();

    if (!blob || blob.size === 0) {
      return { status: "error", message: GENERIC_ERROR_MESSAGE };
    }

    return { status: "success", blob };
  } catch {
    return { status: "error", message: GENERIC_ERROR_MESSAGE };
  }
}
