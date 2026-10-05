import type { CSSProperties } from "react";

// Outlook drops stylesheets, custom properties and rem, so the sheet is styled only through these
// px values and hex colours, written inline on every element.
export const colour = {
  paper: "#f8fafc",
  sheet: "#ffffff",
  ink: "#0f172a",
  inkSoft: "#475569",
  inkFaint: "#64748b",
  line: "#cbd5e1",
  lineSoft: "#e2e8f0",
  accent: "#ec4815",
  accentText: "#d13f13",
  accentLight: "#ffd3c1",
  doneText: "#39745c",
  doneLight: "#e8f7ef",
  reviewText: "#0574e4",
  reviewLight: "#dceeff",
  idleText: "#64748b",
  idleLight: "#f1f5f9",
};

// No web font: Outlook cannot load one, so the page shows the same system face the email gets.
export const FONT = '"Segoe UI", Helvetica, Arial, sans-serif';

export const SHEET_WIDTH = 864;
export const SHEET_PADDING_X = 30;
// The sheet is a table, which browsers size border-box, so its 2px border is inside the width.
export const CONTENT_WIDTH = SHEET_WIDTH - SHEET_PADDING_X * 2 - 4;

// NOTE: [26 Sep 2026] EK - Every text element names its own font, size and colour. A pasted email
// has no body to inherit from, so anything left to inheritance arrives in Outlook as Times.
export const text = (size = 16, colourValue = colour.ink, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: FONT,
  fontSize: `${size}px`,
  lineHeight: 1.6,
  color: colourValue,
  margin: 0,
  ...extra,
});

// NOTE: [26 Sep 2026] EK - Outlook's paste filter drops text-transform and text-decoration-color
// everywhere, and padding, margin and white-space on a span. Small caps are written in capitals,
// underlines stay the text colour, and inline spacing is non-breaking spaces. lib/outlook-safe.ts
// flags any of these that creep back in.
export const label: CSSProperties = text(11.5, colour.inkFaint, {
  fontWeight: 600,
  letterSpacing: "0.08em",
});

export const caps = (value: string) => value.toUpperCase();

/** Non-breaking spaces: the only horizontal spacing Outlook keeps on inline text. */
export const gap = (count = 1) => "\u00a0".repeat(count);

export const link: CSSProperties = {
  color: colour.ink,
  textDecoration: "underline",
};

export const STATUS_COLOURS: Record<string, { text: string; background: string }> = {
  done: { text: colour.doneText, background: colour.doneLight },
  inReview: { text: colour.reviewText, background: colour.reviewLight },
  inProgress: { text: colour.accentText, background: colour.accentLight },
};
