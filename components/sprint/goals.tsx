"use client";
import React from "react";
import { tinaField } from "tinacms/dist/react";
import { A, Block, Callout, GoalBadge, H2, Pending, Section } from "../email/primitives";
import { colour, text } from "../email/theme";
import { linkify } from "../../lib/refs";
import { RULE_FORECAST, SCOPE_QUOTE } from "../../lib/ssw";
import { goalKey } from "./status";
import { field, type Maybe, type SprintKind } from "./section-kit";

type Goal = { status?: Maybe<string>; title?: Maybe<string>; text?: Maybe<string>; fromCall?: Maybe<string> };

const table = { width: "100%", borderCollapse: "collapse" } as const;
const plain = { role: "presentation", cellPadding: 0, cellSpacing: 0, border: 0 } as const;

/** Sprint Goals: one shaded card per goal, with its outcome badge. */
export function Goals({
  doc,
  kind,
  githubOwner,
}: {
  doc: { goals?: Maybe<Maybe<Goal>[]> };
  kind: SprintKind;
  githubOwner?: string | null;
}) {
  const goals = (doc.goals ?? []).filter((goal): goal is Goal => !!goal && !!(goal.title?.trim() || goal.text?.trim()));
  const review = kind === "review";
  return (
    <Section empty={!goals.length} label="Sprint Goals">
      <H2>Sprint Goals</H2>
      {goals.length ? (
        goals.map((goal, index) => (
          <Block key={index} bottom={review ? 4 : 6}>
            <table {...plain} style={table}>
              <tbody>
                <tr>
                  <td
                    {...({ bgcolor: colour.paper } as object)}
                    style={{
                      backgroundColor: colour.paper,
                      padding: review ? "8px 12px" : "10px 12px",
                      ...(review ? {} : { borderLeft: `4px solid ${colour.accent}` }),
                    }}
                  >
                    <table {...plain} style={table}>
                      <tbody>
                        <tr>
                          <td {...({ width: "1%", valign: "top" } as object)} style={{ width: "1%", padding: 0, verticalAlign: "top" }}>
                            <GoalBadge status={goalKey(goal.status)} kind={kind} tinaField={field(goal, "status")} />
                          </td>
                          <td data-tina-field={field(goal, "text")} style={text(16, colour.ink, { padding: "0 0 0 8px", verticalAlign: "top" })}>
                            {review ? null : <strong style={{ color: colour.accent }}>{index + 1}.</strong>}
                            {review ? null : " "}
                            {goal.title ? (
                              <>
                                <strong data-tina-field={field(goal, "title")}>{goal.title}</strong>
                                {goal.text ? " - " : null}
                              </>
                            ) : null}
                            {linkify(goal.text ?? "", githubOwner)}
                            {goal.fromCall ? <Callout tinaField={field(goal, "fromCall")}>{linkify(goal.fromCall, githubOwner)}</Callout> : null}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </Block>
        ))
      ) : (
        <Pending tinaField={field(doc, "goals")}>{review ? "Copied from the Sprint Forecast" : "Set at Sprint Planning"}</Pending>
      )}
    </Section>
  );
}

const firstName = (name?: Maybe<string>) => name?.trim().split(/\s+/)[0] ?? "";

/** The forecast's opening: the greeting, the rule link and the Scope quote. */
export function Intro({
  doc,
}: {
  doc: { number?: Maybe<number>; productOwner?: Maybe<string>; scopeNote?: Maybe<string> };
}) {
  const first = firstName(doc.productOwner);
  return (
    <Section>
      {first ? (
        <p data-tina-field={field(doc, "productOwner")} style={text(16, colour.ink, { margin: "16px 0 0" })}>
          Hi {first},
        </p>
      ) : (
        <div data-copy="empty" data-empty-label="Greeting">
          <Pending tinaField={field(doc, "productOwner")}>Set the Product Owner to add the greeting</Pending>
        </div>
      )}
      <p style={text(16, colour.ink, { margin: "16px 0" })}>
        Here is the forecast for Sprint {doc.number} as per the <A href={RULE_FORECAST.url}>Sprint Forecast rule</A>.
      </p>
      <table {...plain} style={table}>
        <tbody>
          <tr>
            <td
              data-tina-field={field(doc, "scopeNote")}
              style={text(16, colour.inkLabel, {
                backgroundColor: colour.paper,
                borderLeft: `4px solid ${colour.accent}`,
                padding: "12px 16px",
                fontStyle: "italic",
              })}
            >
              {doc.scopeNote?.trim() || SCOPE_QUOTE}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
