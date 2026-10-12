import { linkify } from "../../lib/refs";
import type { RichTextValue } from "../../lib/rich-text";
import { A, Block, Figure, Grid, Pending, Td } from "../email/primitives";
import { RichText } from "../email/rich-text";
import { colour, gap, text } from "../email/theme";
import { field, type Maybe, type SectionBlock, type SectionRenderer } from "./section-kit";

type Team = {
  team?: Maybe<string>;
  hours?: Maybe<number>;
  previousHours?: Maybe<number>;
  image?: Maybe<string>;
  caption?: RichTextValue;
  sourceLabel?: Maybe<string>;
  sourceUrl?: Maybe<string>;
  placeholder?: Maybe<string>;
};
type Adr = {
  title?: Maybe<string>;
  url?: Maybe<string>;
  change?: Maybe<string>;
  summary?: Maybe<string>;
  pr?: Maybe<string>;
};
type Person = { person?: Maybe<string>; tools?: RichTextValue; limits?: Maybe<string>; expiry?: Maybe<string> };

const hoursChange = (hours?: Maybe<number>, previous?: Maybe<number>) => {
  if (hours == null || previous == null) return null;
  if (hours === previous) return "same as last Sprint";
  return `${hours > previous ? "up" : "down"} from ${previous} h last Sprint`;
};

const Hours: SectionRenderer = ({ section }) => {
  const items: Maybe<Team>[] = section.items ?? [];
  return (
    <>
      {items.map((entry, index) => (
        <Block key={index} bottom={28}>
          <p style={text()}>
            <span style={{ fontWeight: 600 }}>{entry?.team}</span>
            {gap(2)}
            <span style={{ fontSize: "21.6px", fontWeight: 620, letterSpacing: "-0.02em" }}>{entry?.hours} h</span>
            {gap(2)}
            <span style={{ fontSize: "13.6px", color: colour.inkFaint }}>
              {hoursChange(entry?.hours, entry?.previousHours)}
            </span>
          </p>
          <Figure
            image={entry?.image}
            caption={entry?.caption}
            sourceLabel={entry?.sourceLabel}
            sourceUrl={entry?.sourceUrl}
            pending={entry?.placeholder || undefined}
            captionField={field(entry, "caption")}
          />
        </Block>
      ))}
    </>
  );
};

const AiTools: SectionRenderer = ({ section }) => {
  const items: Maybe<Person>[] = section.items ?? [];
  return (
    <Grid top={0} head={[{ label: "Person" }, { label: "Tools" }, { label: "Limits" }, { label: "Expiry" }]}>
      {items.map((row, index) => (
        <tr key={index}>
          <Td tinaField={field(row, "person")}>{row?.person}</Td>
          <Td tinaField={field(row, "tools")}>
            <RichText value={row?.tools} />
          </Td>
          <Td tinaField={field(row, "limits")}>{row?.limits}</Td>
          <Td tinaField={field(row, "expiry")}>{row?.expiry}</Td>
        </tr>
      ))}
    </Grid>
  );
};

const Adrs: SectionRenderer = ({ section, githubOwner }) => {
  const items: Maybe<Adr>[] = section.items ?? [];
  if (!items.length) {
    return (
      <div data-tina-field={field(section, "items")}>
        <Pending>{section.placeholder || "No ADR changes this Sprint"}</Pending>
      </div>
    );
  }
  return (
    <Grid top={0} head={[{ label: "ADR" }, { label: "Change" }, { label: "Summary" }, { label: "PR" }]}>
      {items.map((row, index) => (
        <tr key={index}>
          <Td tinaField={field(row, "title")}>{row?.url ? <A href={row.url}>{row?.title}</A> : row?.title}</Td>
          <Td tinaField={field(row, "change")}>{row?.change}</Td>
          <Td tinaField={field(row, "summary")}>{row?.summary}</Td>
          <Td tinaField={field(row, "pr")}>{linkify(row?.pr ?? "", githubOwner)}</Td>
        </tr>
      ))}
    </Grid>
  );
};

// Renderers for the templates in tina/collections/custom-sections.ts, keyed by template name.
export const CUSTOM_RENDERERS: Record<string, SectionRenderer> = { hours: Hours, teamAiTools: AiTools, adrs: Adrs };

// A custom section is always copied into the email. Add its name here, with a test for "nothing in
// it", and Copy for Email leaves it out when it is empty, heading and all.
export const CUSTOM_EMPTY: Record<string, (section: SectionBlock) => boolean> = {};
