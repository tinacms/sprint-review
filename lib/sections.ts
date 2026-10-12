import type { Maybe, SectionBlock } from "../components/sprint/section-kit";
import { isRichTextEmpty, type RichNode } from "./rich-text";

type Estimated = { estimate?: Maybe<number>; status?: Maybe<string> };

// Generated typenames are the collection plus the template, e.g. SprintReviewSectionsFigures.
export const templateOf = (section: SectionBlock) =>
  (section.__typename ?? "").replace(/^Sprint(Review|Forecast)Sections/, "").toLowerCase();

/** The sprint's backlog section, whose items the summaries count. */
export const backlogOf = (sections?: Maybe<Maybe<SectionBlock>[]>) =>
  (sections ?? []).find((section) => section && templateOf(section) === "backlog");

export const backlogPoints = (items: Maybe<Estimated>[], status?: string) =>
  items.filter((item) => !status || item?.status === status).reduce((sum, item) => sum + (item?.estimate ?? 0), 0);

const named = (section: Maybe<SectionBlock>, heading: string) => section?.heading?.trim().toLowerCase() === heading.toLowerCase();

/**
 * Whether the document carries its own section under this heading, which then stands in for the fixed block
 * of that name. A blank one does not, so the fixed block shows and the blank one is left off the page.
 */
export const hasSection = (sections: Maybe<Maybe<SectionBlock>[]>, heading: string, isEmpty: (section: SectionBlock) => boolean) =>
  (sections ?? []).some((section) => !!section && named(section, heading) && !isEmpty(section));

// The blocks the page supplies itself, each of which a document's own section of the same name replaces.
const FIXED_HEADINGS = ["Sprint Details", "References"];

/** The sections without a blank one under the heading of a fixed block, so the page and the copy both skip it. */
export const withoutBlank = (sections: Maybe<Maybe<SectionBlock>[]>, isEmpty: (section: SectionBlock) => boolean) =>
  (sections ?? []).filter((section) => !section || !FIXED_HEADINGS.some((heading) => named(section, heading)) || !isEmpty(section));

// A rich-text field is an object even when the editor holds nothing, so it is read for its words.
const said = (value: unknown) =>
  typeof value === "object" && value !== null
    ? !isRichTextEmpty(value as RichNode)
    : value != null && value !== false && String(value).trim() !== "";

// What makes an item worth a row, for the templates whose new items arrive with a label already set.
const ITEM_KEYS: Record<string, string[]> = {
  backlog: ["title", "id", "url"],
  cards: ["value"],
  team: ["name", "handle"],
};

/**
 * Whether any item of the section says something. Tina saves `{}` when someone adds an item and types
 * nothing, and a new review starts with snapshot cards that have labels and no numbers. Its own keys
 * (`__typename`, `_content_source`) start with an underscore and are not content.
 */
export const hasItems = (section: SectionBlock) => {
  const keys = ITEM_KEYS[templateOf(section)];
  return (section.items ?? []).some(
    (item) => !!item && (keys ?? Object.keys(item).filter((key) => !key.startsWith("_"))).some((key) => said(item[key]))
  );
};
