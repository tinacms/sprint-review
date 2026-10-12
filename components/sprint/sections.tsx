"use client";
import React from "react";
import { tinaField } from "tinacms/dist/react";
import { A, Badge, Block, Callout, Chip, Grid, H2, H3, List, Note, Pending, Section, Td } from "../email/primitives";
import { RichText } from "../email/rich-text";
import { caps, colour, label } from "../email/theme";
import { itemId, linkify } from "../../lib/refs";
import { isRichTextEmpty, type RichTextValue } from "../../lib/rich-text";
import { hasItems, templateOf } from "../../lib/sections";
import { CUSTOM_EMPTY, CUSTOM_RENDERERS } from "./custom-sections";
import { Figures, isFiguresEmpty } from "./figures";
import { AiTools, Cards, Team, Velocity } from "./ssw-sections";
import { statusBadge } from "./status";
import {
  field,
  formatNumber,
  present,
  signed,
  spaced,
  type Maybe,
  type SectionBlock,
  type SectionRenderer,
  type SprintKind,
} from "./section-kit";

type BacklogItem = {
  title?: Maybe<string>;
  url?: Maybe<string>;
  id?: Maybe<string>;
  assignees?: Maybe<string>;
  estimate?: Maybe<number>;
  status?: Maybe<string>;
  bonus?: Maybe<boolean>;
  movedTo?: Maybe<number>;
  origin?: Maybe<string>;
  bold?: Maybe<boolean>;
};
type Deployment = { product?: Maybe<string>; count?: Maybe<number>; versions?: Maybe<string> };
type Metric = { label?: Maybe<string>; url?: Maybe<string>; previous?: Maybe<number>; current?: Maybe<number>; lowerIsBetter?: Maybe<boolean> };
type Progress = {
  name?: Maybe<string>;
  url?: Maybe<string>;
  group?: Maybe<string>;
  done?: Maybe<number>;
  total?: Maybe<number>;
  previousPercent?: Maybe<number>;
};

const sumPoints = (items: BacklogItem[]) => items.reduce((total, item) => total + (item.estimate ?? 0), 0);
const points = (items: BacklogItem[]) => `${formatNumber(sumPoints(items))} pts`;

const Backlog: SectionRenderer = ({ section, kind, githubOwner, sprintNumber }) => {
  const items = (section.items ?? []).filter((item): item is BacklogItem => !!item);
  const review = kind === "review";
  if (!hasItems(section)) return <Pending tinaField={field(section, "items")}>Add the backlog items</Pending>;

  const stats: React.ReactNode[] = [];
  if (review) {
    const done = items.filter((item) => item.status === "done");
    // An item moved to a later Sprint is counted there, not as still in progress.
    const inProgress = items.filter((item) => item.status === "inProgress" && item.movedTo == null);
    const moved = items.filter((item) => item.movedTo != null);
    const targets = [...new Set(moved.map((item) => item.movedTo as number))].sort((a, b) => a - b);
    const bonus = items.filter((item) => item.bonus).length;
    stats.push(`${done.length} completed (${points(done)})`);
    if (inProgress.length) stats.push(`${inProgress.length} in progress (${points(inProgress)})`);
    targets.forEach((target) => {
      const group = moved.filter((item) => item.movedTo === target);
      stats.push(`${group.length} moved to Sprint ${target} (${points(group)})`);
    });
    if (bonus) stats.push(`${bonus} bonus`);
  } else {
    const carried = items.filter((item) => item.origin === "carryOver").length;
    const added = items.filter((item) => item.origin === "new").length;
    stats.push(`${items.length} items${carried + added ? ` (${carried} carry-over + ${added} new)` : ""}`);
    stats.push(<strong key="total">Total committed: {points(items)}</strong>);
  }
  if (section.netChange?.trim()) {
    stats.push(
      <span key="net" data-tina-field={field(section, "netChange")}>
        Net change: {linkify(section.netChange, githubOwner)}
      </span>
    );
  }

  return (
    <>
      {review ? (
        <Note top={0} bottom={12} size={16} italic>
          Items assigned to Sprint {sprintNumber} on the project board (single source of truth). <strong>Bold</strong> items were
          discussed during the review.
        </Note>
      ) : null}
      <Grid
        head={[
          { label: "ID" },
          { label: "Title" },
          { label: "Assignee" },
          ...(review ? [{ label: "Status" }] : []),
          { label: "Effort" },
        ]}
      >
        {items.map((item, index) => {
          const id = itemId(item);
          const badge = statusBadge(item.status);
          return (
            <tr key={index}>
              <Td tinaField={field(item, item.url ? "url" : "id")} style={{ whiteSpace: "nowrap" }}>
                {id ? item.url ? <A href={item.url}>{id}</A> : id : null}
              </Td>
              <Td tinaField={field(item, "title")}>
                {item.bold ? <strong>{item.title}</strong> : item.title}
                {review && item.bonus ? (
                  <Chip kind="bonus" tinaField={field(item, "bonus")}>
                    Bonus
                  </Chip>
                ) : null}
                {review && item.movedTo != null ? (
                  <Chip kind="movedTo" tinaField={field(item, "movedTo")}>
                    {`Moved to S${item.movedTo}`}
                  </Chip>
                ) : null}
                {!review && item.origin === "carryOver" ? (
                  <Chip kind="carryOver" tinaField={field(item, "origin")}>
                    Carry over
                  </Chip>
                ) : null}
                {!review && item.origin === "new" ? (
                  <Chip kind="new" tinaField={field(item, "origin")}>
                    New
                  </Chip>
                ) : null}
              </Td>
              <Td tinaField={field(item, "assignees")}>
                {item.assignees?.trim() ? item.assignees : <span style={{ color: colour.inkFaint }}>-</span>}
              </Td>
              {review ? (
                <Td tinaField={field(item, "status")}>
                  <Badge badge={badge} label={badge.label} />
                </Td>
              ) : null}
              <Td tinaField={field(item, "estimate")} style={{ whiteSpace: "nowrap" }}>
                {item.estimate != null ? `${formatNumber(item.estimate)} pts` : null}
              </Td>
            </tr>
          );
        })}
      </Grid>
      <Note>
        {stats.map((stat, index) => (
          <React.Fragment key={index}>
            {index > 0 ? " \u00b7 " : null}
            {stat}
          </React.Fragment>
        ))}
      </Note>
      {section.note?.trim() ? (
        <Note top={8} size={13} tinaField={field(section, "note")}>
          {linkify(section.note, githubOwner)}
        </Note>
      ) : null}
      {!review && section.fromCall?.trim() ? (
        <Callout top={12} tinaField={field(section, "fromCall")}>
          {linkify(section.fromCall, githubOwner)}
        </Callout>
      ) : null}
    </>
  );
};

const Deployments: SectionRenderer = ({ section }) => {
  const items: Maybe<Deployment>[] = section.items ?? [];
  if (!hasItems(section)) return <Pending tinaField={field(section, "items")}>Add the products</Pending>;
  return (
    <Grid top={0}>
      {items.map((deployment, index) => {
        const shipped = (deployment?.count ?? 0) > 0;
        return (
          <tr key={index}>
            <Td
              num
              tinaField={field(deployment, "count")}
              style={{
                width: "48px",
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-1px",
                lineHeight: 1.2,
                color: shipped ? colour.doneText : colour.inkFaint,
              }}
            >
              {deployment?.count ?? 0}
            </Td>
            <Td tinaField={field(deployment, "product")} style={{ fontWeight: 600, paddingLeft: "12px" }}>
              {deployment?.product}
            </Td>
            <Td tinaField={field(deployment, "versions")} style={{ color: colour.inkSoft, fontSize: "14px" }}>
              {deployment?.versions || "No release this Sprint"}
            </Td>
          </tr>
        );
      })}
    </Grid>
  );
};

const Metrics: SectionRenderer = ({ section }) => {
  const items: Maybe<Metric>[] = section.items ?? [];
  if (!hasItems(section)) return <Pending tinaField={field(section, "items")}>Add the metrics</Pending>;
  return (
    <>
      <Grid
        top={0}
        head={[
          { label: section.labelHeading || "Metric" },
          { label: "Last Sprint", num: true },
          { label: "This Sprint", num: true },
          { label: "Change", num: true },
        ]}
      >
        {items.map((metric, index) => {
          const delta = metric?.current == null || metric?.previous == null ? null : metric.current - metric.previous;
          const better = delta != null && (metric?.lowerIsBetter ? delta < 0 : delta > 0);
          return (
            <tr key={index}>
              <Td tinaField={field(metric, "label")}>{metric?.url ? <A href={metric.url}>{metric.label}</A> : metric?.label}</Td>
              <Td num tinaField={field(metric, "previous")}>
                {formatNumber(metric?.previous)}
              </Td>
              <Td num tinaField={field(metric, "current")}>
                {formatNumber(metric?.current)}
              </Td>
              <Td num style={{ color: !delta ? colour.inkFaint : better ? colour.doneText : colour.accentText }}>
                {delta == null ? null : signed(delta)}
              </Td>
            </tr>
          );
        })}
      </Grid>
      {section.note ? <Note tinaField={field(section, "note")}>{section.note}</Note> : null}
    </>
  );
};

function ProgressBar({ percent }: { percent: number }) {
  const cell = { height: "6px", padding: 0, fontSize: "1px", lineHeight: "1px" };
  return (
    <table style={{ width: "144px", borderCollapse: "collapse" }}>
      <tbody>
        <tr>
          {percent > 0 ? (
            <td height={6} style={{ ...cell, width: `${percent}%`, backgroundColor: colour.accent }}>
              &nbsp;
            </td>
          ) : null}
          {percent < 100 ? (
            <td height={6} style={{ ...cell, backgroundColor: colour.line }}>
              &nbsp;
            </td>
          ) : null}
        </tr>
      </tbody>
    </table>
  );
}

const ProgressSection: SectionRenderer = ({ section }) => {
  const items: Maybe<Progress>[] = section.items ?? [];
  if (!hasItems(section)) return <Pending tinaField={field(section, "items")}>Add the epics</Pending>;
  const groups = items.reduce<Record<string, Maybe<Progress>[]>>((byGroup, item) => {
    const key = item?.group ?? "";
    byGroup[key] = [...(byGroup[key] ?? []), item];
    return byGroup;
  }, {});

  return (
    <>
      <Grid top={0}>
        {Object.entries(groups).map(([group, rows]) => (
          <React.Fragment key={group}>
            {group ? (
              <tr>
                <td colSpan={4} style={{ ...label, padding: "24px 0 8px", borderBottom: `1px solid ${colour.lineSoft}` }}>
                  {caps(group)}
                </td>
              </tr>
            ) : null}
            {rows.map((item, index) => {
              const done = item?.done ?? 0;
              const percent = Math.round((done / Math.max(item?.total ?? 1, 1)) * 100);
              const change = item?.previousPercent == null ? null : percent - item.previousPercent;
              return (
                <tr key={index}>
                  <Td tinaField={field(item, "name")}>{item?.url ? <A href={item.url}>{item.name}</A> : item?.name}</Td>
                  <Td style={{ width: "160px", verticalAlign: "middle" }}>
                    <ProgressBar percent={percent} />
                  </Td>
                  <Td num tinaField={field(item, "done")} style={{ width: "80px", color: colour.inkSoft, whiteSpace: "nowrap" }}>
                    {done} / {item?.total ?? 0}
                  </Td>
                  <Td
                    num
                    tinaField={field(item, "previousPercent")}
                    style={{
                      width: "96px",
                      fontSize: "13px",
                      color: change ? (change > 0 ? colour.doneText : colour.accentText) : colour.inkFaint,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {change == null ? null : change === 0 ? "no change" : `${signed(change)}%`}
                  </Td>
                </tr>
              );
            })}
          </React.Fragment>
        ))}
      </Grid>
      {section.sourceLabel ? (
        <Note>
          <A href={section.sourceUrl}>{section.sourceLabel}</A>
        </Note>
      ) : null}
    </>
  );
};

const ListSection: SectionRenderer = ({ section, githubOwner }) => {
  const entries = present(section.entries);
  if (!entries.length) {
    return (
      <Pending size={14} tinaField={field(section, "entries")}>
        {section.placeholder || "Click here to add items..."}
      </Pending>
    );
  }
  return (
    <List
      items={entries.map((entry) => linkify(entry.text, githubOwner))}
      itemField={(item) => tinaField(section as any, "entries", entries[item].index)}
    />
  );
};

const TextSection: SectionRenderer = ({ section, githubOwner }) => {
  if (isRichTextEmpty(section.body)) {
    return <Pending tinaField={field(section, "body")}>{section.placeholder || "Nothing added yet"}</Pending>;
  }
  return (
    <RichText
      value={section.body}
      size={section.small ? 14 : 16}
      colour={section.small ? colour.inkSoft : colour.ink}
      gap={12}
      linkIssues
      githubOwner={githubOwner}
      tinaField={field(section, "body")}
    />
  );
};

const RENDERERS: Record<string, SectionRenderer> = {
  backlog: Backlog,
  figures: Figures,
  velocity: Velocity,
  aiTools: AiTools,
  cards: Cards,
  team: Team,
  deployments: Deployments,
  metrics: Metrics,
  progress: ProgressSection,
  list: ListSection,
  text: TextSection,
  ...CUSTOM_RENDERERS,
};

const keyed = <T,>(table: Record<string, T>, section: SectionBlock) =>
  Object.entries(table).find(([name]) => name.toLowerCase() === templateOf(section))?.[1];

const rendererFor = (section: SectionBlock) => keyed(RENDERERS, section);

const noItems = (section: SectionBlock) => !hasItems(section);

// A section with nothing in it keeps its placeholder on the page and is left out of the copied email.
// A custom section is never left out unless custom-sections.tsx says so in CUSTOM_EMPTY.
const EMPTY: Record<string, (section: SectionBlock) => boolean> = {
  backlog: noItems,
  deployments: noItems,
  metrics: noItems,
  progress: noItems,
  velocity: noItems,
  aiTools: noItems,
  cards: noItems,
  team: noItems,
  figures: isFiguresEmpty,
  list: (section) => !present(section.entries).length,
  text: (section) => isRichTextEmpty(section.body),
};

export const isEmpty = (section: SectionBlock) => (keyed(EMPTY, section) ?? keyed(CUSTOM_EMPTY, section))?.(section) ?? false;

type Group = { main: SectionBlock; subsections: SectionBlock[] };

// A subsection joins the cell of the section above it, so their margins collapse as one section's.
const grouped = (sections: Maybe<Maybe<SectionBlock>[]>) =>
  (sections ?? []).reduce<Group[]>((groups, section) => {
    if (!section || !rendererFor(section)) return groups;
    const last = groups[groups.length - 1];
    if (section.subsection && last) last.subsections.push(section);
    else groups.push({ main: section, subsections: [] });
    return groups;
  }, []);

/** The team's own sections, in the order the editor lists them. */
export function Sections({
  sections,
  kind,
  githubOwner,
  sprintNumber,
}: {
  sections?: Maybe<Maybe<SectionBlock>[]>;
  kind: SprintKind;
  githubOwner?: string | null;
  sprintNumber?: number | null;
}) {
  const body = (section: SectionBlock) => {
    const Renderer = rendererFor(section)!;
    return <Renderer section={section} kind={kind} githubOwner={githubOwner} sprintNumber={sprintNumber} />;
  };
  return (
    <>
      {grouped(sections).map(({ main, subsections }, index) => {
        const mainEmpty = isEmpty(main);
        const subEmpty = subsections.map(isEmpty);
        const allEmpty = mainEmpty && subEmpty.every(Boolean);
        const name = main.heading || "A section";
        const gaps = spaced([mainEmpty, ...subEmpty]);
        return (
          <Section key={index} tinaField={field(main)} empty={allEmpty} label={name}>
            {main.heading ? <H2 tinaField={field(main, "heading")}>{main.heading}</H2> : null}
            {mainEmpty && !allEmpty ? (
              <div data-copy="empty" data-empty-label={name} style={{ paddingBottom: `${gaps[0].bottom}px` }}>
                {body(main)}
              </div>
            ) : (
              body(main)
            )}
            {subsections.map((sub, subIndex) => (
              <div
                key={subIndex}
                data-tina-field={field(sub)}
                data-copy={subEmpty[subIndex] ? "empty" : undefined}
                data-empty-label={subEmpty[subIndex] ? sub.heading || name : undefined}
                style={subEmpty[subIndex] ? { paddingBottom: `${gaps[subIndex + 1].bottom}px` } : undefined}
              >
                {sub.heading ? (
                  <H3 top={gaps[subIndex + 1].top} tinaField={field(sub, "heading")}>
                    {sub.heading}
                  </H3>
                ) : null}
                {body(sub)}
              </div>
            ))}
          </Section>
        );
      })}
    </>
  );
}
