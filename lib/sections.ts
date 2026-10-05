import type { Maybe, SectionBlock } from "../components/sprint/section-kit";

type Estimated = { estimate?: Maybe<number>; status?: Maybe<string> };

// Generated typenames are the collection plus the template, e.g. SprintReviewSectionsFigures.
export const templateOf = (section: SectionBlock) =>
  (section.__typename ?? "").replace(/^Sprint(Review|Forecast)Sections/, "").toLowerCase();

/** The sprint's backlog section, whose items the summaries count. */
export const backlogOf = (sections?: Maybe<Maybe<SectionBlock>[]>) =>
  (sections ?? []).find((section) => section && templateOf(section) === "backlog");

export const backlogPoints = (items: Maybe<Estimated>[], status?: string) =>
  items.filter((item) => !status || item?.status === status).reduce((sum, item) => sum + (item?.estimate ?? 0), 0);
