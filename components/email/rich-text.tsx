import React, { createContext, useContext, type ReactNode } from "react";
import { Link } from "react-email";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import { toBlocks, type RichTextValue } from "../../lib/rich-text";
import { colour, link, text } from "./theme";

type Look = { size: number; colour: string; weight: number; indent: number };
type Spaced = { gapBefore?: number; gapAfter?: number; heading?: boolean; children?: ReactNode };

// TinaMarkdown memoises each node on its own data, so the look travels by context and the
// components below stay module-level.
const LookContext = createContext<Look>({ size: 14, colour: colour.ink, weight: 400, indent: 24 });

const margin = ({ gapBefore = 0, gapAfter = 0 }: Spaced) => `${gapBefore}px 0 ${gapAfter}px`;

const Paragraph = (props: Spaced) => {
  const look = useContext(LookContext);
  return <p style={text(look.size, look.colour, { fontWeight: props.heading ? 700 : look.weight, margin: margin(props) })}>{props.children}</p>;
};

const listOf = (Tag: "ul" | "ol") =>
  function ListBlock(props: Spaced) {
    const look = useContext(LookContext);
    return <Tag style={{ margin: margin(props), padding: `0 0 0 ${look.indent}px` }}>{props.children}</Tag>;
  };

const Item = (props: Spaced) => {
  const look = useContext(LookContext);
  return <li style={text(look.size, look.colour, { fontWeight: look.weight, margin: margin(props) })}>{props.children}</li>;
};

// The words of a list item sit straight in the li, so the li's own font reaches them.
const ItemText = ({ children }: Spaced) => <>{children}</>;

const Anchor = ({ url, children }: { url?: string; children?: ReactNode }) => (
  <Link href={url} style={link}>
    {children}
  </Link>
);

const LineBreak = () => <br />;

// Bold and italic stay as TinaMarkdown's own strong and em. Everything else the editor can write has
// been flattened by lib/rich-text.ts before it gets here.
const components = { p: Paragraph, ul: listOf("ul"), ol: listOf("ol"), li: Item, lic: ItemText, a: Anchor, break: LineBreak };

/**
 * A Tina rich-text field in the email's own markup. The wrapper carries the click-to-edit hook and
 * is left without styles, so the copy keeps only the paragraphs and lists inside it.
 */
export function RichText({
  value,
  size = 14,
  colour: ink = colour.ink,
  weight = 400,
  indent = 24,
  gap,
  itemGap,
  before,
  after,
  prefix,
  source,
  linkIssues,
  githubOwner,
  tinaField,
}: {
  value: RichTextValue;
  size?: number;
  colour?: string;
  weight?: number;
  indent?: number;
  gap?: number;
  itemGap?: number;
  before?: number;
  after?: number;
  prefix?: "Figure" | "Table";
  source?: { label?: string | null; url?: string | null };
  linkIssues?: boolean;
  githubOwner?: string | null;
  tinaField?: string;
}) {
  const blocks = toBlocks(value, { gap, itemGap, before, after, prefix, source, linkIssues, githubOwner });
  if (!blocks.length) return null;
  return (
    <LookContext.Provider value={{ size, colour: ink, weight, indent }}>
      <div data-tina-field={tinaField}>
        <TinaMarkdown content={blocks as never} components={components as never} />
      </div>
    </LookContext.Provider>
  );
}
