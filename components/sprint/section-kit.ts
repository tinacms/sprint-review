import type React from "react";
import { tinaField } from "tinacms/dist/react";
import type { RichTextValue } from "../../lib/rich-text";

export type Maybe<T> = T | null | undefined;

export type SectionBlock = {
  __typename?: string;
  heading?: Maybe<string>;
  subsection?: Maybe<boolean>;
  items?: Maybe<Maybe<any>[]>;
  entries?: Maybe<Maybe<string>[]>;
  note?: Maybe<string>;
  body?: RichTextValue;
  small?: Maybe<boolean>;
  placeholder?: Maybe<string>;
  labelHeading?: Maybe<string>;
  sourceLabel?: Maybe<string>;
  sourceUrl?: Maybe<string>;
  netChange?: Maybe<string>;
  fromCall?: Maybe<string>;
  caption?: RichTextValue;
  averageVelocity?: Maybe<number>;
  pointsPerDay?: Maybe<number>;
};

export type SprintKind = "review" | "forecast";

/** What every section renderer, built in or custom, is given. */
export type SectionRenderer = React.ComponentType<{
  section: SectionBlock;
  kind: SprintKind;
  githubOwner?: string | null;
  sprintNumber?: number | null;
}>;

export const field = (item: any, name?: string, index?: number) => (item ? tinaField(item, name, index) : undefined);

export const formatNumber = (value?: number | null) => (value == null ? null : value.toLocaleString("en"));

/** One decimal place, and none for a whole number. */
export const oneDecimal = (value: number) => String(Math.round(value * 10) / 10);

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export const signed = (value: number) => (value > 0 ? `+${formatNumber(value)}` : formatNumber(value));

/** The non-blank entries of a string list, each with its place in the stored list so a click opens the right one. */
export const present = (entries?: Maybe<Maybe<string>[]>) =>
  (entries ?? []).flatMap((text, index) => (text?.trim() ? [{ text, index }] : []));

/**
 * The space above and below each part of a run that sits 16px apart. The email drops the parts flagged
 * empty, so the first part it keeps starts flush and has no gap of its own. A dropped part ahead of it
 * holds that gap on the page instead, and takes it away when it goes.
 */
export const spaced = (dropped: boolean[], space = 16) =>
  dropped.map((isDropped, index) => {
    const keptBefore = dropped.slice(0, index).some((flag) => !flag);
    if (!isDropped) return { top: keptBefore ? space : 0, bottom: 0 };
    return { top: index ? space : 0, bottom: !keptBefore && dropped[index + 1] === false ? space : 0 };
  });
