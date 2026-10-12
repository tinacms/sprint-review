"use client";
import React from "react";
import { tinaField } from "tinacms/dist/react";
import { A, Block, H2, H3, List, Pending, Section } from "../email/primitives";
import { RichText } from "../email/rich-text";
import type { Settings } from "../../lib/settings";
import { isRichTextEmpty, isUnreadable, type RichTextValue } from "../../lib/rich-text";
import { DEFAULT_PORTAL_HEADING, RULE_FORECAST, RULE_REVIEW } from "../../lib/ssw";
import type { SprintDoc } from "./sprint-frame";
import { spaced, type Maybe, type SprintKind } from "./section-kit";

type Retro = {
  wentWell?: RichTextValue;
  didntGoWell?: RichTextValue;
  improvements?: RichTextValue;
};

const RETRO = [
  { key: "wentWell", title: "✅ What Went Well" },
  { key: "didntGoWell", title: "❌ What Didn't Go Well" },
  { key: "improvements", title: "💡 Improvements for Next Sprint" },
] as const;

const OLD_SHAPE = "This column is saved as a list, which Tina cannot read as text. Run node scripts/migrate-rich-text.mjs.";

/** The three retro columns. An empty column, or the whole part, is left out of the email. */
export function RetroSection({ doc }: { doc: { retro?: Maybe<Retro> } }) {
  const retro = doc.retro;
  const empty = RETRO.map((column) => isRichTextEmpty(retro?.[column.key]));
  const allEmpty = empty.every(Boolean);
  const gaps = spaced(empty);
  return (
    <Section tinaField={tinaField(doc as any, "retro")} empty={allEmpty} label="Sprint Retrospective">
      <H2>Sprint Retrospective</H2>
      {RETRO.map((column, index) => {
        const field = retro ? tinaField(retro as any, column.key) : undefined;
        return (
          <Block
            key={column.key}
            bottom={gaps[index].bottom}
            copy={empty[index] ? "empty" : undefined}
            label={`Sprint Retrospective: ${column.title.replace(/^\S+\s/, "")}`}
          >
            <H3 tone="ink" top={gaps[index].top}>
              {column.title}
            </H3>
            {empty[index] ? (
              <Pending size={14} tinaField={field}>
                {isUnreadable(retro?.[column.key]) ? OLD_SHAPE : "Click here to add items..."}
              </Pending>
            ) : (
              <Block top={8} bottom={8} tinaField={field}>
                <RichText value={retro?.[column.key]} after={6} />
              </Block>
            )}
          </Block>
        );
      })}
    </Section>
  );
}

/** The rule, the Project Portal, and any links the team adds. */
export function References({ doc, kind, settings }: { doc: SprintDoc; kind: SprintKind; settings: Settings }) {
  const rule = kind === "review" ? RULE_REVIEW : RULE_FORECAST;
  const fixed = [
    <A key="rule" href={rule.url}>
      {rule.label}
    </A>,
    ...(settings.boardUrl
      ? [
          <A key="portal" href={settings.boardUrl}>
            {settings.boardHeading || DEFAULT_PORTAL_HEADING}: {settings.teamName}
          </A>,
        ]
      : []),
  ];
  // Each keeps its place in the stored list, so a click opens the right one when a blank entry sits between.
  const extra = (doc.references ?? []).flatMap((reference, index) => (reference?.url ? [{ reference, index }] : []));
  return (
    <Section>
      <H2>References</H2>
      <List
        size={16}
        indent={20}
        gap={0}
        inset={0}
        margin="0 0 16px"
        items={[
          ...fixed,
          ...extra.map(({ reference }, position) => (
            <A key={position} href={reference?.url}>
              {reference?.label || reference?.url}
            </A>
          )),
        ]}
        itemField={(position) =>
          position >= fixed.length ? tinaField(doc as any, "references", extra[position - fixed.length].index) : undefined
        }
      />
    </Section>
  );
}
