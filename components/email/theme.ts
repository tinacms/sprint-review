import type { CSSProperties } from "react";

// Outlook drops stylesheets, custom properties and rem, so the sheet is styled only through these
// px values and hex colours, written inline on every element. The hexes are repeated as custom
// properties in app/globals.css for the page around the sheet.
export const colour = {
  paper: "#f8f9fa",
  sheet: "#ffffff",
  ink: "#333333",
  inkLabel: "#444444",
  inkMuted: "#555555",
  inkSoft: "#666666",
  inkFaint: "#888888",
  inkStruck: "#999999",
  line: "#dee2e6",
  lineSoft: "#eeeeee",
  chip: "#f1f3f5",
  band: "#333333",
  bandSub: "#aaaaaa",
  accent: "#cc4141",
  tintRow: "#fff8f8",
  accentText: "#cc4141",
  accentLight: "#f8d7da",
  doneText: "#155724",
  doneLight: "#d4edda",
  reviewText: "#004085",
  reviewLight: "#cce5ff",
  blockedText: "#721c24",
  blockedLight: "#f8d7da",
  idleText: "#383d41",
  idleLight: "#e2e3e5",
  callBar: "#facc15",
  callBody: "#fefce8",
  callTag: "#fef3c7",
  callText: "#92400e",
  frame: "#fafafa",
};

// No web font: Outlook cannot load one, so the page shows the same system face the email gets.
export const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const SHEET_WIDTH = 900;
export const SECTION_PAD = "24px 32px";
// The card is a table, which browsers size border-box, so its 2px border is inside the width.
export const CONTENT_WIDTH = SHEET_WIDTH - 4 - 64;
// Space between a heading's red rule and what follows, as the template's copied output has it.
export const RULE_GAP = 16;

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
export const label: CSSProperties = text(12, colour.inkMuted, {
  fontWeight: 600,
  letterSpacing: "0.5px",
});

export const caps = (value: string) => value.toUpperCase();

/** Non-breaking spaces: the only horizontal spacing Outlook keeps on inline text. */
export const gap = (count = 1) => " ".repeat(count);

/** Words joined by non-breaking spaces, so a badge or header stays on one line in every client. */
export const joined = (value: string) => value.replace(/ /g, gap());

export const link: CSSProperties = {
  color: colour.accent,
  textDecoration: "underline",
};

type Badge = { label: string; background: string; text: string };

/** Backlog item status, keyed as stored. An unknown key falls back to backlog. */
export const STATUS_BADGES: Record<string, Badge> = {
  done: { label: "DONE", background: "#d4edda", text: "#155724" },
  pendingRelease: { label: "PENDING RELEASE", background: "#cfe2ff", text: "#084298" },
  inReview: { label: "IN REVIEW", background: "#cce5ff", text: "#004085" },
  inProgress: { label: "IN PROGRESS", background: "#fff3cd", text: "#856404" },
  ready: { label: "READY", background: "#d1ecf1", text: "#0c5460" },
  blocked: { label: "BLOCKED", background: "#f8d7da", text: "#721c24" },
  backlog: { label: "BACKLOG", background: "#e2e3e5", text: "#383d41" },
  needsTriage: { label: "NEEDS TRIAGE", background: "#e2e3e5", text: "#383d41" },
  wontDo: { label: "WON’T DO", background: "#f8d7da", text: "#721c24" },
};

/** Sprint goal outcome. The review label carries a symbol; the forecast label does not. */
export const GOAL_BADGES: Record<string, Badge & { symbol: string }> = {
  suggested: { label: "SUGGESTED", symbol: "⚠", background: "#e2e3e5", text: "#383d41" },
  done: { label: "DONE", symbol: "✔", background: "#d4edda", text: "#155724" },
  partial: { label: "PARTIAL", symbol: "◯", background: "#fff3cd", text: "#856404" },
  missed: { label: "MISSED", symbol: "✘", background: "#f8d7da", text: "#721c24" },
};

/** The small tags after a backlog title. */
export const CHIPS = {
  bonus: { background: "#e7f5ff", text: "#1971c2" },
  movedTo: { background: "#fff3cd", text: "#856404" },
  carryOver: { background: "#fff3cd", text: "#856404" },
  new: { background: "#d4edda", text: "#155724" },
} as const;
