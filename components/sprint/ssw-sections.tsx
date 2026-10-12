"use client";
import React from "react";
import { Img } from "react-email";
import { Caption, Grid, Note, Pending, Td } from "../email/primitives";
import { caps, colour, gap, text } from "../email/theme";
import { isRichTextEmpty, type RichTextValue } from "../../lib/rich-text";
import { RichText } from "../email/rich-text";
import { hasItems } from "../../lib/sections";
import { field, formatNumber, oneDecimal, plural, type Maybe, type SectionRenderer } from "./section-kit";

const plain = { role: "presentation", cellPadding: 0, cellSpacing: 0, border: 0 } as const;
const table = { width: "100%", borderCollapse: "collapse" } as const;

type VelocityRow = {
  sprint?: Maybe<number>;
  committed?: Maybe<number>;
  delivered?: Maybe<number>;
  workingDays?: Maybe<number>;
  workingNote?: Maybe<string>;
  isCurrent?: Maybe<boolean>;
};

const mean = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

export const Velocity: SectionRenderer = ({ section }) => {
  const items: Maybe<VelocityRow>[] = section.items ?? [];
  if (!hasItems(section)) return <Pending tinaField={field(section, "items")}>Add the recent Sprints</Pending>;

  const past = items.filter((row): row is VelocityRow => !!row && !row.isCurrent);
  const delivered = past.map((row) => row.delivered).filter((value): value is number => value != null);
  const days = past.map((row) => row.workingDays).filter((value): value is number => value != null);
  const average = section.averageVelocity ?? mean(delivered);
  const perDay = section.pointsPerDay ?? (mean(delivered) != null && mean(days) ? mean(delivered)! / mean(days)! : null);

  return (
    <>
      <Grid head={[{ label: "Sprint" }, { label: "Originally Committed" }, { label: "Delivered", bold: true }, { label: "%" }, { label: "Working" }]}>
        {items.map((row, index) => {
          const current = !!row?.isCurrent;
          const percent = row?.committed ? Math.round(((row.delivered ?? 0) / row.committed) * 100) : null;
          const cell = (extra: React.CSSProperties = {}): React.CSSProperties =>
            current
              ? { backgroundColor: colour.tintRow, fontWeight: 700, borderBottom: `2px solid ${colour.accent}`, ...extra }
              : extra;
          return (
            <tr key={index}>
              <Td tinaField={field(row, "sprint")} style={cell(current ? { color: colour.accent } : {})}>
                Sprint {row?.sprint}
                {current ? " (current)" : null}
              </Td>
              <Td tinaField={field(row, "committed")} style={cell()}>
                {row?.committed != null ? `${formatNumber(row.committed)} pts` : null}
              </Td>
              <Td tinaField={field(row, "delivered")} style={cell({ fontWeight: 700 })}>
                {row?.delivered != null ? `${formatNumber(row.delivered)} pts` : null}
              </Td>
              <Td style={cell()}>{percent != null ? `${percent}%` : null}</Td>
              <Td tinaField={field(row, "workingDays")} style={cell()}>
                {row?.workingDays != null ? plural(row.workingDays, "day") : null}
                {row?.workingNote ? (
                  <span data-tina-field={field(row, "workingNote")}> ({row.workingNote})</span>
                ) : null}
              </Td>
            </tr>
          );
        })}
      </Grid>
      {average != null ? (
        <Note top={8}>
          <strong>Average velocity:</strong> <span data-tina-field={field(section, "averageVelocity")}>{oneDecimal(average)} pts/sprint</span>
          {perDay != null ? (
            <>
              {" | ~"}
              <span data-tina-field={field(section, "pointsPerDay")}>{oneDecimal(perDay)} pts/working day</span>
            </>
          ) : null}
        </Note>
      ) : null}
    </>
  );
};

const LIMITS: Record<string, string> = {
  never: "✅ Never",
  sometimes: "⚠️ Sometimes",
  often: "❌ Often",
};

type AiRow = { member?: Maybe<string>; tools?: RichTextValue; planUsed?: Maybe<number>; limits?: Maybe<string> };

/** The share of a plan used, as a dot (green from 75, yellow from 50, red below) and the percent. */
const planUsed = (percent: number) => {
  const whole = Math.round(percent);
  return `${whole >= 75 ? "🟢" : whole >= 50 ? "🟡" : "🔴"}${gap()}${whole}%`;
};

// A row saved before Plan used existed shows its Hitting limits answer until a percent is entered.
const isOld = (row: Maybe<AiRow>) => row?.planUsed == null && !!row?.limits;

export const AiTools: SectionRenderer = ({ section }) => {
  const items: Maybe<AiRow>[] = section.items ?? [];
  if (!hasItems(section)) return <Pending tinaField={field(section, "items")}>Add the team members</Pending>;
  const hasCaption = !isRichTextEmpty(section.caption);
  // A table of old answers keeps the old heading, which describes them. The first percent switches it.
  const allOld = items.some(isOld) && items.every((row) => row?.planUsed == null);
  return (
    <>
      <Grid head={[{ label: "Team Member" }, { label: "AI Tools" }, { label: allOld ? "Hitting Limits" : "Plan used" }]}>
        {items.map((row, index) => (
          <tr key={index}>
            <Td tinaField={field(row, "member")}>{row?.member}</Td>
            <Td tinaField={field(row, "tools")}>
              <RichText value={row?.tools} />
            </Td>
            <Td tinaField={field(row, isOld(row) ? "limits" : "planUsed")}>
              {row?.planUsed != null ? planUsed(row.planUsed) : LIMITS[row?.limits ?? ""]}
            </Td>
          </tr>
        ))}
      </Grid>
      {hasCaption ? (
        <Caption value={section.caption} prefix="Table" before={10} after={0} tinaField={field(section, "caption")} />
      ) : (
        <Pending size={14} tinaField={field(section, "caption")}>
          Add a caption: the most interesting thing this table shows, such as who is using little of their plan
        </Pending>
      )}
    </>
  );
};

type CardItem = { value?: Maybe<string>; label?: Maybe<string> };

/** Rows of `perRow` cells, the last one padded with empty cells so every column stays the same width. */
function chunk<T>(items: T[], perRow: number): (T | null)[][] {
  const rows: (T | null)[][] = [];
  for (let start = 0; start < items.length; start += perRow) {
    const row: (T | null)[] = items.slice(start, start + perRow);
    while (row.length < perRow) row.push(null);
    rows.push(row);
  }
  return rows;
}

export const Cards: SectionRenderer = ({ section }) => {
  const items: Maybe<CardItem>[] = section.items ?? [];
  if (!hasItems(section)) return <Pending tinaField={field(section, "items")}>Add the snapshot numbers</Pending>;
  return (
    <table {...plain} style={table}>
      <tbody>
        {chunk(items, 4).map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((card, index) => (
              <td key={index} {...({ width: "25%" } as object)} style={{ width: "25%", padding: "8px" }}>
                {card ? (
                  <table {...plain} style={{ ...table, backgroundColor: colour.paper, borderRadius: "8px" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <p
                            data-tina-field={field(card, "value")}
                            style={text(28, card.value?.trim() ? colour.accent : colour.inkFaint, { fontWeight: 700 })}
                          >
                            {card.value?.trim() || "-"}
                          </p>
                          <p
                            data-tina-field={field(card, "label")}
                            style={text(12, colour.inkMuted, { letterSpacing: "0.5px" })}
                          >
                            {caps(card.label ?? "")}
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

type Member = {
  name?: Maybe<string>;
  handle?: Maybe<string>;
  avatar?: Maybe<string>;
  availability?: Maybe<string>;
  unavailable?: Maybe<boolean>;
  reason?: Maybe<string>;
};

const AVATAR = 56;

export const Team: SectionRenderer = ({ section }) => {
  const items: Maybe<Member>[] = section.items ?? [];
  if (!hasItems(section)) return <Pending tinaField={field(section, "items")}>Add the team members</Pending>;
  // Balanced rows of at most six, so eight people are two rows of four, not six and two.
  const perRow = Math.ceil(items.length / Math.ceil(items.length / 6));
  return (
    <table {...plain} style={table}>
      <tbody>
        {chunk(items, perRow).map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((member, index) => {
              const away = !!member?.unavailable;
              const handle = member?.handle?.trim().replace(/^@/, "");
              // NOTE: [12 Oct 2026] EK - Only avatars.githubusercontent.com sends CORS headers, which the copy
              // needs to embed the picture. github.com/<handle>.png redirects there without them.
              const avatar = member?.avatar || (handle ? `https://avatars.githubusercontent.com/${handle}?size=112` : "");
              const struck = away ? { color: colour.inkStruck, textDecoration: "line-through" } : {};
              return (
                <td
                  key={index}
                  {...({ width: `${(100 / perRow).toFixed(2)}%`, valign: "top", align: "center" } as object)}
                  style={{ width: `${(100 / perRow).toFixed(2)}%`, padding: "8px", textAlign: "center", verticalAlign: "top" }}
                >
                  {member ? (
                    <table
                      {...plain}
                      style={{
                        ...table,
                        backgroundColor: colour.paper,
                        borderRadius: "8px",
                        borderTop: `3px solid ${away ? colour.blockedText : colour.accent}`,
                      }}
                    >
                      <tbody>
                        <tr>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            {avatar ? (
                              <table {...plain} align="center" style={{ borderCollapse: "collapse", margin: "0 auto" }}>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: "0 0 8px" }}>
                                      <Img
                                        src={avatar}
                                        alt={member.name ?? ""}
                                        width={AVATAR}
                                        height={AVATAR}
                                        data-tina-field={field(member, "avatar")}
                                        style={{ display: "block", borderRadius: "50%", ...(away ? { opacity: 0.5 } : {}) }}
                                      />
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            ) : null}
                            <p data-tina-field={field(member, "name")} style={text(14, colour.ink, { fontWeight: 600, ...struck })}>
                              {member.name}
                            </p>
                            {handle ? (
                              <p data-tina-field={field(member, "handle")} style={text(12, away ? colour.inkStruck : colour.inkSoft)}>
                                <a
                                  href={`https://github.com/${handle}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: away ? colour.inkStruck : colour.inkSoft, textDecoration: away ? "line-through" : "none" }}
                                >
                                  @{handle}
                                </a>
                              </p>
                            ) : null}
                            {away || member.availability ? (
                              <p
                                data-tina-field={field(member, away ? "reason" : "availability")}
                                style={text(11, away ? colour.blockedText : colour.doneText, { margin: "4px 0 0" })}
                              >
                                {away ? `0 days${member.reason ? ` (${member.reason})` : ""}` : member.availability}
                              </p>
                            ) : null}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : null}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
