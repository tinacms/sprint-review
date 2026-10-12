import React, { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Column, Img, Link, Row } from "react-email";
import { plainText, type RichTextValue } from "../../lib/rich-text";
import { RichText } from "./rich-text";
import { CHIPS, GOAL_BADGES, RULE_GAP, SECTION_PAD, SHEET_WIDTH, caps, colour, CONTENT_WIDTH, FONT, gap, joined, link, text } from "./theme";

type Tina = { tinaField?: string };
type Copy = {
  /** "skip" is page-only chrome; "empty" is a part with nothing in it. Copy for Email removes both. */
  copy?: "skip" | "empty";
  /** What the copy reports as left out when this part is empty. */
  label?: string;
};

const table: CSSProperties = { width: "100%", borderCollapse: "collapse" };
const plain = { role: "presentation", cellPadding: 0, cellSpacing: 0, border: 0 } as const;

/** The accent-framed card, with the copy-only signature below it. Everything in the card is the email. */
export function Sheet({ children, after }: { children: ReactNode; after?: ReactNode }) {
  return (
    <div id="sheet" style={{ width: `${SHEET_WIDTH}px`, maxWidth: "100%" }}>
      <table
        {...plain}
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          backgroundColor: colour.sheet,
          border: `2px solid ${colour.accent}`,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: 0 }}>{children}</td>
          </tr>
        </tbody>
      </table>
      {after}
    </div>
  );
}

/** Vertical rhythm through cell padding, because Outlook ignores margins on tables. */
export function Block({
  top = 0,
  bottom = 0,
  pad,
  bgcolor,
  children,
  tinaField,
  style,
  copy,
  label,
}: Tina &
  Copy & { top?: number; bottom?: number; pad?: string; bgcolor?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <Row style={table} data-copy={copy} data-empty-label={copy === "empty" ? label : undefined}>
      <Column
        {...(bgcolor ? ({ bgcolor } as object) : {})}
        data-tina-field={tinaField}
        style={{ ...(pad ? { padding: pad } : { paddingTop: `${top}px`, paddingBottom: `${bottom}px` }), verticalAlign: "top", ...style }}
      >
        {children}
      </Column>
    </Row>
  );
}

/** One heading and its body, ruled off from the next. */
export function Section({ children, tinaField, empty, label }: Tina & { children: ReactNode; empty?: boolean; label?: string }) {
  return (
    <Block
      pad={SECTION_PAD}
      tinaField={tinaField}
      copy={empty ? "empty" : undefined}
      label={label}
      style={{ borderBottom: `1px solid ${colour.lineSoft}` }}
    >
      {children}
    </Block>
  );
}

// NOTE: [12 Oct 2026] EK - The rule under a heading is its own table row, not a border on the h2,
// because Outlook draws an h2 border thick. This is what the template's copied output does too.
export const H2 = ({ children, tinaField }: Tina & { children: ReactNode }) => (
  <table {...plain} width="100%" style={table}>
    <tbody>
      <tr>
        <td style={{ padding: "0 0 8px" }}>
          <h2 data-tina-field={tinaField} style={text(20, colour.ink, { fontWeight: 700 })}>
            {children}
          </h2>
        </td>
      </tr>
      <tr>
        <td
          style={{
            borderTop: `2px solid ${colour.accent}`,
            padding: `0 0 ${RULE_GAP}px`,
            height: 0,
            lineHeight: 0,
            fontSize: 0,
          }}
        />
      </tr>
    </tbody>
  </table>
);

export const H3 = ({
  children,
  top = 16,
  tone = "label",
  tinaField,
}: Tina & { children: ReactNode; top?: number; tone?: "label" | "ink" }) => (
  <h3
    data-tina-field={tinaField}
    style={text(16, tone === "ink" ? colour.ink : colour.inkLabel, { fontWeight: 700, margin: `${top}px 0 8px` })}
  >
    {children}
  </h3>
);

export const P = ({ children, style, tinaField }: Tina & { children: ReactNode; style?: CSSProperties }) => (
  <p data-tina-field={tinaField} style={{ ...text(), ...style }}>
    {children}
  </p>
);

export const Note = ({
  children,
  tinaField,
  top = 12,
  bottom = 0,
  size = 14,
  italic = false,
}: Tina & { children: ReactNode; top?: number; bottom?: number; size?: number; italic?: boolean }) => (
  <p
    data-tina-field={tinaField}
    style={text(size, colour.inkSoft, { margin: `${top}px 0 ${bottom}px`, ...(italic ? { fontStyle: "italic" } : {}) })}
  >
    {children}
  </p>
);

/** A prompt shown on the page only, never in the email. */
export const Pending = ({ children, tinaField, size = 16 }: Tina & { children: ReactNode; size?: number }) => (
  <p data-copy="skip" data-tina-field={tinaField} style={text(size, colour.inkFaint, { fontStyle: "italic" })}>
    {children}
  </p>
);

export const A = ({ href, bold, children }: { href?: string | null; bold?: boolean | null; children: ReactNode }) => (
  <Link href={href ?? undefined} style={bold ? { ...link, fontWeight: 700 } : link}>
    {children}
  </Link>
);

/**
 * A figure or table caption, in the template's bold 15px. It is rich text, so a link or italic
 * words come through; bold changes nothing because the whole caption is already bold.
 */
export const Caption = ({
  value,
  prefix,
  source,
  tinaField,
  before = 6,
  after = 14,
}: Tina & {
  value: RichTextValue;
  prefix: "Figure" | "Table";
  source?: { label?: string | null; url?: string | null };
  before?: number;
  after?: number;
}) => (
  <RichText
    value={value}
    prefix={prefix}
    source={source}
    size={15}
    colour={colour.inkLabel}
    weight={700}
    before={before}
    after={after}
    tinaField={tinaField}
  />
);

// The template wraps a pasted screenshot and its caption in a rounded grey frame with 16px of padding.
const FIGURE_PAD = 16;
const FIGURE_WIDTH = CONTENT_WIDTH - 2 * FIGURE_PAD;

/** A pasted screenshot with its caption in the template's grey frame, or the dashed prompt to add one. */
export function Figure({
  image,
  alt,
  caption,
  sourceLabel,
  sourceUrl,
  captionField,
  pending = "Paste a screenshot in the editor",
}: {
  image?: string | null;
  /** Used when the caption says nothing, for people whose mail client blocks the picture. */
  alt?: string;
  caption?: RichTextValue;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  captionField?: string;
  pending?: string;
}) {
  const captioned = <Caption value={caption} prefix="Figure" source={{ label: sourceLabel, url: sourceUrl }} tinaField={captionField} />;

  if (!image) {
    return (
      <>
        <table {...plain} data-copy="skip" style={table}>
          <tbody>
            <tr>
              <td
                style={text(16, colour.inkFaint, {
                  height: "80px",
                  padding: `${FIGURE_PAD}px`,
                  textAlign: "center",
                  fontStyle: "italic",
                  backgroundColor: colour.frame,
                  border: "2px dashed #cccccc",
                  borderRadius: "6px",
                })}
              >
                {pending}
              </td>
            </tr>
          </tbody>
        </table>
        {captioned}
      </>
    );
  }

  return (
    <table {...plain} style={table}>
      <tbody>
        <tr>
          <td
            {...({ bgcolor: colour.frame } as object)}
            style={{ backgroundColor: colour.frame, padding: `${FIGURE_PAD}px`, borderRadius: "6px", verticalAlign: "top" }}
          >
            <table {...plain} style={{ ...table, maxWidth: `${FIGURE_WIDTH}px` }}>
              <tbody>
                <tr>
                  <td style={{ padding: "8px 0" }}>
                    <Img
                      src={image}
                      alt={plainText(caption) || alt || ""}
                      width={FIGURE_WIDTH}
                      style={{ width: "100%", maxWidth: `${FIGURE_WIDTH}px`, height: "auto" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            {captioned}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// Share of a column's narrowest width added as spare room. Outlook drew a header about 20% wider than
// Chrome measured it (PERSO / N), and its body breaks words that do not fit.
const COLUMN_SLACK = 0.25;

/**
 * Sizes a table's columns from its content: each gets its narrowest width plus slack, and the room
 * left over goes to the columns that want to grow, in proportion. The result is set as percentages,
 * so the page and the copied email share one layout, and it is measured again whenever the text
 * changes.
 */
function useColumnWidths(tableRef: React.RefObject<HTMLTableElement>) {
  const [widths, setWidths] = useState<string[] | null>(null);
  const measuredText = useRef<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs after every render; the text check skips repeats
  useLayoutEffect(() => {
    const table = tableRef.current;
    const cells = table?.tHead?.rows[0] ? Array.from(table.tHead.rows[0].cells) : [];
    if (!table || cells.length < 2 || table.textContent === measuredText.current) return;
    measuredText.current = table.textContent;

    const saved = cells.map((cell) => cell.style.width);
    const savedTable = table.style.width;
    cells.forEach((cell) => (cell.style.width = ""));
    const measureAt = (width: string) => {
      table.style.width = width;
      return cells.map((cell) => cell.getBoundingClientRect().width);
    };
    const narrowest = measureAt("1px");
    const natural = measureAt("max-content");
    table.style.width = savedTable;
    cells.forEach((cell, index) => (cell.style.width = saved[index]));

    const padded = narrowest.map((width) => Math.ceil(width * (1 + COLUMN_SLACK)));
    const spare = CONTENT_WIDTH - padded.reduce((sum, width) => sum + width, 0);
    const growth = natural.map((width, index) => Math.max(0, width - padded[index]));
    const totalGrowth = growth.reduce((sum, width) => sum + width, 0);
    const final =
      spare <= 0
        ? narrowest
        : padded.map((width, index) => width + (totalGrowth ? (spare * growth[index]) / totalGrowth : spare / padded.length));
    setWidths(final.map((width) => `${((width / CONTENT_WIDTH) * 100).toFixed(2)}%`));
  });

  return widths;
}

/** A data table: a shaded header row of labels and ruled body rows. */
export function Grid({
  head,
  children,
  tinaField,
  top = 0,
}: Tina & { head?: { label: string; num?: boolean; bold?: boolean }[]; children: ReactNode; top?: number }) {
  const tableRef = useRef<HTMLTableElement>(null);
  const widths = useColumnWidths(tableRef);
  return (
    <Block top={top} tinaField={tinaField}>
      <table ref={tableRef} style={table}>
        {head ? (
          <thead>
            <tr>
              {head.map((cell, index) => (
                <th
                  key={cell.label}
                  style={text(14, colour.ink, {
                    fontWeight: cell.bold ? 700 : 600,
                    backgroundColor: colour.chip,
                    textAlign: cell.num ? "right" : "left",
                    padding: "10px 12px",
                    borderBottom: `2px solid ${colour.line}`,
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                    width: widths?.[index],
                  })}
                >
                  {joined(cell.label)}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>{children}</tbody>
      </table>
    </Block>
  );
}

export const Td = ({
  children,
  num = false,
  style,
  tinaField,
  colSpan,
}: Tina & { children?: ReactNode; num?: boolean; style?: CSSProperties; colSpan?: number }) => (
  <td
    colSpan={colSpan}
    data-tina-field={tinaField}
    style={text(14, colour.ink, {
      padding: "10px 12px",
      borderBottom: `1px solid ${colour.lineSoft}`,
      verticalAlign: "middle",
      textAlign: num ? "right" : "left",
      ...style,
    })}
  >
    {children}
  </td>
);

type Colours = { background: string; text: string };

// NOTE: [12 Oct 2026] EK - A badge is a one-cell table with bgcolor and nowrap, and its words joined
// by non-breaking spaces, as the template's rows have it. A width of 1% here would stretch it across
// its column, because a percentage cell makes a shrink-to-fit table fill the room it has.
function BadgeCell({
  colours,
  children,
  size,
  weight,
  padding,
  tinaField,
}: Tina & { colours: Colours; children: ReactNode; size: number; weight: number; padding: string }) {
  return (
    <table {...plain} style={{ borderCollapse: "collapse" }}>
      <tbody>
        <tr>
          <td
            {...({ bgcolor: colours.background, nowrap: "nowrap" } as object)}
            data-tina-field={tinaField}
            style={text(size, colours.text, {
              fontWeight: weight,
              backgroundColor: colours.background,
              padding,
              whiteSpace: "nowrap",
            })}
          >
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** The status column badge: square, capitals, one line. */
export const Badge = ({ badge, label, tinaField }: Tina & { badge: Colours; label: string }) => (
  <BadgeCell colours={badge} size={11} weight={600} padding="2px 8px" tinaField={tinaField}>
    {joined(caps(label))}
  </BadgeCell>
);

/** A Sprint goal's outcome. The review's is larger and carries a symbol. */
export function GoalBadge({ status, kind, tinaField }: Tina & { status: keyof typeof GOAL_BADGES; kind: "review" | "forecast" }) {
  const goal = GOAL_BADGES[status];
  const review = kind === "review";
  return (
    <BadgeCell
      colours={goal}
      size={review ? 12 : 10}
      weight={review ? 700 : 600}
      padding={review ? "3px 10px" : "2px 6px"}
      tinaField={tinaField}
    >
      {review ? `${goal.symbol}${gap()}` : null}
      {joined(goal.label)}
    </BadgeCell>
  );
}

// NOTE: [12 Oct 2026] EK - An inline tag cannot have padding or a radius in Outlook, so it is a run
// of text with a background and non-breaking spaces either side.
export const Chip = ({ kind, children, tinaField }: Tina & { kind: keyof typeof CHIPS; children: string }) => (
  <>
    {gap(2)}
    <span
      data-tina-field={tinaField}
      style={text(11, CHIPS[kind].text, { fontWeight: 600, backgroundColor: CHIPS[kind].background })}
    >
      {gap(2)}
      {joined(caps(children))}
      {gap(2)}
    </span>
  </>
);

/** A note that came from the call, in the template's yellow bar. */
export function Callout({ children, top = 6, tinaField }: Tina & { children: ReactNode; top?: number }) {
  return (
    <table {...plain} width="100%" style={table}>
      <tbody>
        <tr>
          <td style={{ padding: `${top}px 0 0` }}>
            <table {...plain} width="100%" style={table}>
              <tbody>
                <tr>
                  <td {...({ bgcolor: colour.callBar, width: 3 } as object)} style={{ backgroundColor: colour.callBar, width: "3px" }}>
                    &nbsp;
                  </td>
                  <td
                    {...({ bgcolor: colour.callBody } as object)}
                    data-tina-field={tinaField}
                    style={text(16, colour.ink, { backgroundColor: colour.callBody, padding: "6px 10px" })}
                  >
                    <table {...plain}>
                      <tbody>
                        <tr>
                          <td
                            {...({ bgcolor: colour.callTag } as object)}
                            style={text(11, colour.callText, { backgroundColor: colour.callTag, padding: "1px 4px" })}
                          >
                            FROM{gap()}CALL
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {children}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export type DetailRow = {
  label: string;
  value?: ReactNode;
  field?: string;
  /** Nothing to show: a prompt on the page, left out of the email. */
  empty?: boolean;
  prompt?: string;
};

// NOTE: [12 Oct 2026] EK - The table spans the card and its label column is 1% wide, so the value
// column keeps spare room. A table sized exactly to its longest row wrapped that row in the copy,
// where the frozen column width rounds a fraction of a pixel below the text.
/** Label and value pairs with no header or borders. */
export function DetailsTable({ rows }: { rows: DetailRow[] }) {
  return (
    <table {...plain} width="100%" style={table}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} data-copy={row.empty ? "empty" : undefined} data-empty-label={row.empty ? row.label : undefined}>
            <td
              {...({ width: "1%", nowrap: "nowrap" } as object)}
              style={text(16, colour.inkLabel, { fontWeight: 600, padding: "6px 16px 6px 0", whiteSpace: "nowrap", width: "1%" })}
            >
              {joined(row.label)}
            </td>
            <td data-tina-field={row.field} style={text(16, colour.ink, { padding: "6px 0" })}>
              {row.empty ? <span style={text(16, colour.inkFaint, { fontStyle: "italic" })}>{row.prompt}</span> : row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function List({
  items,
  tinaField,
  itemField,
  size = 14,
  indent = 24,
  gap: rowGap = 6,
  inset = 8,
  margin = "0",
}: Tina & {
  items: ReactNode[];
  itemField?: (index: number) => string | undefined;
  size?: number;
  indent?: number;
  gap?: number;
  inset?: number;
  margin?: string;
}) {
  return (
    <ul data-tina-field={tinaField} style={{ margin, padding: `${inset}px 0 ${inset}px ${indent}px` }}>
      {items.map((item, index) => (
        <li
          key={index}
          data-tina-field={itemField?.(index)}
          style={text(size, colour.ink, rowGap ? { marginBottom: `${rowGap}px` } : {})}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export { FONT };
