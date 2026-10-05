import React, { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Column, Container, Img, Link, Row } from "react-email";
import { STATUS_COLOURS, caps, colour, CONTENT_WIDTH, FONT, gap, label, link, SHEET_PADDING_X, SHEET_WIDTH, text } from "./theme";
import { statusMeta } from "../sprint/status";

type Tina = { tinaField?: string };

const table: CSSProperties = { width: "100%", borderCollapse: "collapse" };

/** The accent-framed sheet. Everything inside it is exactly what Copy for Email sends. */
export function Sheet({ children }: { children: ReactNode }) {
  return (
    <Container
      id="sheet"
      style={{
        width: `${SHEET_WIDTH}px`,
        maxWidth: "100%",
        margin: 0,
        backgroundColor: colour.sheet,
        border: `2px solid ${colour.accent}`,
        borderRadius: "14px",
        padding: `26px ${SHEET_PADDING_X}px 38px`,
      }}
    >
      {children}
    </Container>
  );
}

/** Vertical rhythm through cell padding, because Outlook ignores margins on tables. */
export function Block({
  top = 0,
  bottom = 0,
  children,
  tinaField,
  style,
}: Tina & { top?: number; bottom?: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <Row style={table}>
      <Column
        data-tina-field={tinaField}
        style={{ paddingTop: `${top}px`, paddingBottom: `${bottom}px`, verticalAlign: "top", ...style }}
      >
        {children}
      </Column>
    </Row>
  );
}

export const H2 = ({ children, tinaField }: Tina & { children: ReactNode }) => (
  <h2 data-tina-field={tinaField} style={text(26, colour.ink, { fontWeight: 620, letterSpacing: "-0.02em", lineHeight: 1.3, margin: "0 0 12px" })}>
    {children}
  </h2>
);

export const H3 = ({ children, top = 32, tinaField }: Tina & { children: ReactNode; top?: number }) => (
  <h3 data-tina-field={tinaField} style={text(17, colour.ink, { fontWeight: 600, lineHeight: 1.4, margin: `${top}px 0 10px` })}>
    {children}
  </h3>
);

export const P = ({ children, style, tinaField }: Tina & { children: ReactNode; style?: CSSProperties }) => (
  <p data-tina-field={tinaField} style={{ ...text(), ...style }}>
    {children}
  </p>
);

export const Note = ({ children, tinaField, top = 12 }: Tina & { children: ReactNode; top?: number }) => (
  <p data-tina-field={tinaField} style={text(14.4, colour.inkSoft, { marginTop: `${top}px` })}>
    {children}
  </p>
);

export const Pending = ({ children }: { children: ReactNode }) => (
  <p style={text(16, colour.inkFaint, { fontStyle: "italic" })}>{children}</p>
);

export const A = ({ href, bold, children }: { href?: string | null; bold?: boolean | null; children: ReactNode }) => (
  <Link href={href ?? undefined} style={bold ? { ...link, fontWeight: 700 } : link}>
    {children}
  </Link>
);

export function Figure({
  image,
  caption,
  sourceLabel,
  sourceUrl,
  tinaField,
  pending = "Figure not captured yet",
  top = 20,
}: Tina & {
  image?: string | null;
  caption?: string | null;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  pending?: string;
  top?: number;
}) {
  return (
    <Block top={top} tinaField={tinaField}>
      {image ? (
        <table style={{ ...table, border: `1px solid ${colour.line}` }}>
          <tbody>
            <tr>
              <td style={{ padding: 0 }}>
                <Img
                  src={image}
                  alt={caption ?? ""}
                  width={CONTENT_WIDTH - 2}
                  style={{ width: "100%", maxWidth: `${CONTENT_WIDTH - 2}px`, height: "auto" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table style={table}>
          <tbody>
            <tr>
              <td
                style={text(14.4, colour.inkFaint, {
                  padding: "40px 16px",
                  textAlign: "center",
                  border: `1px dashed ${colour.line}`,
                })}
              >
                {pending}
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {caption || sourceLabel ? (
        <p style={text(13.6, colour.inkSoft, { marginTop: "9px" })}>
          {caption}
          {sourceLabel ? (
            <>
              {caption ? " - " : null}
              <A href={sourceUrl}>{sourceLabel}</A>
            </>
          ) : null}
        </p>
      ) : null}
    </Block>
  );
}

export function Section({ children, first = false, tinaField }: Tina & { children: ReactNode; first?: boolean }) {
  return (
    <Block top={first ? 32 : 56} tinaField={tinaField}>
      {children}
    </Block>
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

/** A data table: a header row of small caps labels and ruled body rows. */
export function Grid({
  head,
  children,
  tinaField,
  top = 16,
}: Tina & { head?: { label: string; num?: boolean; indent?: boolean }[]; children: ReactNode; top?: number }) {
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
                  style={{
                    ...label,
                    textAlign: cell.num ? "right" : "left",
                    padding: cell.num ? "0 0 8px 12px" : `0 12px 8px ${cell.indent ? 12 : 0}px`,
                    borderBottom: `1px solid ${colour.ink}`,
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                    width: widths?.[index],
                  }}
                >
                  {caps(cell.label).replace(/ /g, gap())}
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
    style={text(14.7, colour.ink, {
      padding: num ? "10px 0 10px 12px" : "10px 12px 10px 0",
      borderBottom: `1px solid ${colour.lineSoft}`,
      verticalAlign: "top",
      textAlign: num ? "right" : "left",
      ...style,
    })}
  >
    {children}
  </td>
);

export const Tag = ({ children }: { children: string }) => (
  <>
    {gap(2)}
    <span
      style={text(10.9, colour.accentText, {
        fontWeight: 600,
        letterSpacing: "0.06em",
        backgroundColor: colour.accentLight,
      })}
    >
      {gap()}
      {caps(children)}
      {gap()}
    </span>
  </>
);

export function Pill({ status }: { status?: string | null }) {
  const meta = statusMeta(status);
  const colours = STATUS_COLOURS[status ?? ""] ?? { text: colour.idleText, background: colour.idleLight };
  return (
    <span style={text(12.8, colours.text, { backgroundColor: colours.background })}>
      {gap(2)}
      {meta.icon}
      {gap()}
      {meta.label.replace(/ /g, gap())}
      {gap(2)}
    </span>
  );
}

export function List({
  items,
  tinaField,
  itemField,
}: Tina & { items: ReactNode[]; itemField?: (index: number) => string }) {
  return (
    <ul data-tina-field={tinaField} style={{ margin: 0, paddingLeft: "18px" }}>
      {items.map((item, index) => (
        <li key={index} data-tina-field={itemField?.(index)} style={text(16, colour.ink, { marginBottom: "4px" })}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export { FONT };
