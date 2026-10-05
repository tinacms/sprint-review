import type React from "react";
import { tinaField } from "tinacms/dist/react";

export type Maybe<T> = T | null | undefined;

export type SectionBlock = {
  __typename?: string;
  heading?: Maybe<string>;
  subsection?: Maybe<boolean>;
  items?: Maybe<Maybe<any>[]>;
  entries?: Maybe<Maybe<string>[]>;
  note?: Maybe<string>;
  body?: Maybe<string>;
  small?: Maybe<boolean>;
  placeholder?: Maybe<string>;
  labelHeading?: Maybe<string>;
  sourceLabel?: Maybe<string>;
  sourceUrl?: Maybe<string>;
};

export type SprintKind = "review" | "forecast";

/** What every section renderer, built in or custom, is given. */
export type SectionRenderer = React.ComponentType<{
  section: SectionBlock;
  kind: SprintKind;
  githubOwner?: string | null;
}>;

export const field = (item: any, name?: string, index?: number) => (item ? tinaField(item, name, index) : undefined);

export const formatNumber = (value?: number | null) => (value == null ? null : value.toLocaleString("en"));

export const signed = (value: number) => (value > 0 ? `+${formatNumber(value)}` : formatNumber(value));
