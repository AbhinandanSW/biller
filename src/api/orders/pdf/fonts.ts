import "server-only";

import { Font } from "@react-pdf/renderer";
import path from "node:path";

const FONTS_DIR = path.join(process.cwd(), "assets", "fonts");
const file = (name: string) => path.join(FONTS_DIR, `noto-sans-${name}-normal.woff`);

let registered = false;

/**
 * Noto Sans for PDFs. The Latin files cover text and digits; ₹ lives in the
 * Devanagari subset, so it's registered as a fallback family.
 */
export function registerPdfFonts() {
  if (registered) return;
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: file("latin-400"), fontWeight: 400 },
      { src: file("latin-700"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "NotoSansDevanagari",
    fonts: [
      { src: file("devanagari-400"), fontWeight: 400 },
      { src: file("devanagari-700"), fontWeight: 700 },
    ],
  });
  // Don't split words across lines with hyphens.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

export const PDF_FONT_FAMILY = ["NotoSans", "NotoSansDevanagari"];
