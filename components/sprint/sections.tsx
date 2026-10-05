"use client";
import React from "react";
import { tinaField } from "tinacms/dist/react";
import { A, Figure, Grid, H2, H3, List, Note, P, Pending, Pill, Section, Tag, Td } from "../email/primitives";
import { caps, colour, label } from "../email/theme";
import { linkify } from "../../lib/refs";
import { backlogPoints, templateOf } from "../../lib/sections";
import { CUSTOM_RENDERERS } from "./custom-sections";
import {
  field,
  formatNumber,
  signed,
  type Maybe,
  type SectionBlock,
  type SectionRenderer,
  type SprintKind,
} from "./section-kit";

type BacklogItem = {
  title?: Maybe<string>;
  url?: Maybe<string>;
  assignees?: Maybe<string>;
  estimate?: Maybe<number>;
  status?: Maybe<string>;
  bonus?: Maybe<boolean>;
  bold?: Maybe<boolean>;
};
type FigureItem = {
  image?: Maybe<string>;
  caption?: Maybe<string>;
  sourceLabel?: Maybe<string>;
  sourceUrl?: Maybe<string>;
  placeholder?: Maybe<string>;
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

const Backlog: SectionRenderer = ({ section, kind }) => {
  const items: Maybe<BacklogItem>[] = section.items ?? [];
  return (
    <>
      <Note top={0}>
        {kind === "review"
          ? `${backlogPoints(items, "done")} of ${backlogPoints(items)} points closed across ${items.length} items.`
          : `${items.length} items, ${backlogPoints(items)} points forecast.`}
      </Note>
      <Grid head={[{ label: "Title" }, { label: "Assignees" }, { label: "Estimate", num: true }, { label: "Status", indent: true }]}>
        {items.map((item, index) => (
          <tr key={index}>
            <Td tinaField={field(item, "title")}>
              <A href={item?.url} bold={item?.bold}>
                {item?.title}
              </A>
              {item?.bonus ? <Tag>Bonus</Tag> : null}
            </Td>
            <Td tinaField={field(item, "assignees")} style={{ color: colour.inkSoft, fontSize: "13.9px" }}>
              {item?.assignees}
            </Td>
            <Td num tinaField={field(item, "estimate")}>
              {item?.estimate}
            </Td>
            <Td tinaField={field(item, "status")} style={{ paddingLeft: "12px" }}>
              <Pill status={item?.status} />
            </Td>
          </tr>
        ))}
      </Grid>
      {section.note ? <Note tinaField={field(section, "note")}>{section.note}</Note> : null}
    </>
  );
};

const Figures: SectionRenderer = ({ section }) => {
  const items: Maybe<FigureItem>[] = section.items ?? [];
  if (!items.length) return <Figure top={0} tinaField={field(section, "items")} />;
  return (
    <>
      {items.map((item, index) => (
        <Figure
          key={index}
          top={index === 0 ? 0 : 20}
          image={item?.image}
          caption={item?.caption}
          sourceLabel={item?.sourceLabel}
          sourceUrl={item?.sourceUrl}
          pending={item?.placeholder || undefined}
          tinaField={field(item)}
        />
      ))}
    </>
  );
};

const Deployments: SectionRenderer = ({ section }) => {
  const items: Maybe<Deployment>[] = section.items ?? [];
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
                fontWeight: 620,
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
                color: shipped ? colour.doneText : colour.inkFaint,
              }}
            >
              {deployment?.count ?? 0}
            </Td>
            <Td tinaField={field(deployment, "product")} style={{ fontWeight: 560, paddingLeft: "12px" }}>
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
  const items = section.entries ?? [];
  if (!items.length) {
    return (
      <div data-tina-field={field(section, "entries")}>
        <Pending>{section.placeholder || "Nothing added yet"}</Pending>
      </div>
    );
  }
  return (
    <List
      items={items.map((item) => linkify(item ?? "", githubOwner))}
      itemField={(index) => tinaField(section as any, "entries", index)}
    />
  );
};

const TextSection: SectionRenderer = ({ section, githubOwner }) => {
  const paragraphs = (section.body ?? "").split(/\n\s*\n/).filter((paragraph) => paragraph.trim());
  if (!paragraphs.length) {
    return (
      <div data-tina-field={field(section, "body")}>
        <Pending>{section.placeholder || "Nothing added yet"}</Pending>
      </div>
    );
  }
  return (
    <div data-tina-field={field(section, "body")}>
      {paragraphs.map((paragraph, index) =>
        section.small ? (
          <Note key={index} top={index ? 12 : 0}>
            {linkify(paragraph, githubOwner)}
          </Note>
        ) : (
          <P key={index} style={{ marginTop: index ? "12px" : 0 }}>
            {linkify(paragraph, githubOwner)}
          </P>
        )
      )}
    </div>
  );
};

const RENDERERS: Record<string, SectionRenderer> = {
  backlog: Backlog,
  figures: Figures,
  deployments: Deployments,
  metrics: Metrics,
  progress: ProgressSection,
  list: ListSection,
  text: TextSection,
  ...CUSTOM_RENDERERS,
};

const rendererFor = (section: SectionBlock) =>
  Object.entries(RENDERERS).find(([name]) => name.toLowerCase() === templateOf(section))?.[1];

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
}: {
  sections?: Maybe<Maybe<SectionBlock>[]>;
  kind: SprintKind;
  githubOwner?: string | null;
}) {
  const body = (section: SectionBlock) => {
    const Renderer = rendererFor(section)!;
    return <Renderer section={section} kind={kind} githubOwner={githubOwner} />;
  };
  return (
    <>
      {grouped(sections).map(({ main, subsections }, index) => (
        <Section key={index} tinaField={field(main)}>
          {main.heading ? <H2 tinaField={field(main, "heading")}>{main.heading}</H2> : null}
          {body(main)}
          {subsections.map((sub, subIndex) => (
            <div key={subIndex} data-tina-field={field(sub)}>
              {sub.heading ? <H3 tinaField={field(sub, "heading")}>{sub.heading}</H3> : null}
              {body(sub)}
            </div>
          ))}
        </Section>
      ))}
    </>
  );
}
