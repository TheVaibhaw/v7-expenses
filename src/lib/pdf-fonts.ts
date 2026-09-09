import { Font } from "@react-pdf/renderer";

/**
 * @react-pdf/renderer's built-in "Helvetica" standard font has no glyphs for currency
 * symbols outside the US Dollar (no ₹, and unreliable €/£ coverage) - it silently falls back
 * to whatever glyph collides in that codepoint's position, producing garbled output like
 * "¹100.00" instead of "₹100.00". We register a self-hosted, real Unicode font (Noto Sans,
 * instantiated as static Regular/Bold weights from the variable font so both `fontWeight: 400`
 * and `fontWeight: 700` render correctly) that actually contains ₹ (U+20B9), € (U+20AC) and
 * £ (U+00A3).
 *
 * This must resolve in two very different contexts:
 * - Client (browser): `@react-pdf/renderer` fetches the font from a URL, so a public path works.
 * - Server (Node API route): there is no browser `fetch`/origin to resolve a relative URL
 *   against, so we read the font files straight off disk instead - no network dependency.
 *
 * Called once, lazily, from both entry points (`generate-expense-pdf.tsx` for the client and
 * the `send-expense-email` API route for the server) so the registration logic lives here only.
 */

export const PDF_FONT_FAMILY = "Noto Sans";

let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;
  registered = true;

  if (typeof window === "undefined") {
    // Server: read the font files from the filesystem. Guarded behind `typeof window` so this
    // branch never executes in the browser bundle (Next.js stubs out `fs`/`path` there).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const dir = path.join(process.cwd(), "public", "fonts");
    // @react-pdf/renderer's Font.register accepts a Buffer at runtime, but its TypeScript
    // types only declare `src: string` - read the file to a base64 data URI instead, which is
    // both correctly typed and avoids depending on the untyped Buffer acceptance behavior.
    const toDataUri = (file: string) => `data:font/ttf;base64,${fs.readFileSync(path.join(dir, file)).toString("base64")}`;
    Font.register({
      family: PDF_FONT_FAMILY,
      fonts: [
        { src: toDataUri("NotoSans-Regular.ttf"), fontWeight: 400 },
        { src: toDataUri("NotoSans-Bold.ttf"), fontWeight: 700 },
      ],
    });
  } else {
    Font.register({
      family: PDF_FONT_FAMILY,
      fonts: [
        { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
        { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
      ],
    });
  }
}
