import { Block, Figure, Grid, Td } from "../email/primitives";
import { colour, gap, text } from "../email/theme";
import { field, signed, type Maybe, type SectionRenderer } from "./section-kit";

type Team = {
  team?: Maybe<string>;
  hours?: Maybe<number>;
  previousHours?: Maybe<number>;
  image?: Maybe<string>;
  caption?: Maybe<string>;
  sourceLabel?: Maybe<string>;
  sourceUrl?: Maybe<string>;
  placeholder?: Maybe<string>;
};
type Person = { person?: Maybe<string>; tools?: Maybe<string>; limits?: Maybe<string> };

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
              {signed((entry?.hours ?? 0) - (entry?.previousHours ?? 0))} on {entry?.previousHours} h last Sprint
            </span>
          </p>
          <Figure
            image={entry?.image}
            caption={entry?.caption}
            sourceLabel={entry?.sourceLabel}
            sourceUrl={entry?.sourceUrl}
            pending={entry?.placeholder || undefined}
            tinaField={field(entry)}
          />
        </Block>
      ))}
    </>
  );
};

const AiTools: SectionRenderer = ({ section }) => {
  const items: Maybe<Person>[] = section.items ?? [];
  return (
    <Grid top={0} head={[{ label: "Person" }, { label: "Tools" }, { label: "Limits" }]}>
      {items.map((row, index) => (
        <tr key={index}>
          <Td tinaField={field(row, "person")}>{row?.person}</Td>
          <Td tinaField={field(row, "tools")}>{row?.tools}</Td>
          <Td tinaField={field(row, "limits")}>{row?.limits}</Td>
        </tr>
      ))}
    </Grid>
  );
};

// Renderers for the templates in tina/collections/custom-sections.ts, keyed by template name.
export const CUSTOM_RENDERERS: Record<string, SectionRenderer> = { hours: Hours, aiTools: AiTools };
