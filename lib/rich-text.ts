import { ISSUE_REF, issueUrl } from "./issue-ref";

// Tina stores a rich-text field as a tree: a root holding paragraphs and lists, whose leaves are
// text nodes with bold and italic flags. The editor only offers what the email can carry, but a
// paste or a shortcut can still add more, so everything is reduced to that subset before it is drawn.
export type RichNode = {
  type?: string;
  text?: string;
  value?: string;
  url?: string;
  /** What an image shows, for people who cannot see it. */
  alt?: string;
  /** The Caption box of Tina's image form. */
  caption?: string | null;
  bold?: boolean;
  italic?: boolean;
  /** An array, or a single node: Tina gives one object when a list item holds one raw HTML element. */
  children?: RichNode[] | RichNode;
  /** Space below this block, set by `toBlocks`. */
  gapAfter?: number;
  /** Space above this block, set by `toBlocks` on the first only. */
  gapBefore?: number;
  /** A heading pasted in is kept as a bold paragraph. */
  heading?: boolean;
};

export type RichTextValue = RichNode | null | undefined;

const LISTS = new Set(["ul", "ol"]);
const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const CONTAINERS = new Set(["root", "ul", "ol", "li", "blockquote", "code_block"]);
const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;
const SAFE_IMAGE_URL = /^(https?:\/\/|\/(?!\/))/i;
const PREFIXED = /^(Figure|Table):/i;

// Browsers ignore control characters and spaces inside a scheme, so a check reads without them.
const compact = (url?: string | null) => (url ?? "").replace(/[\u0000-\u001f\u007f\s]+/g, "");

/** A link target the email may carry. Anything else (javascript:, data:) is dropped. */
export const safeUrl = (url?: string | null) => (SAFE_URL.test(compact(url)) ? url!.trim() : undefined);

/** An image the email may carry: a path on this site or a web address. A data: URI or a script is dropped. */
export const safeImageUrl = (url?: string | null) => (SAFE_IMAGE_URL.test(compact(url)) ? url!.trim() : undefined);

const kids = (node?: RichNode | null): RichNode[] => {
  const children = node?.children;
  return Array.isArray(children) ? children : children ? [children] : [];
};

const textOf = (node: RichNode): string => {
  if (typeof node.text === "string") return node.text;
  if (node.type === "break") return " ";
  const parts = kids(node).map(textOf);
  return CONTAINERS.has(node.type ?? "") ? parts.join(" ") : parts.join("");
};

/** What a value says, as one line. Used for labels and alt text. */
export const plainText = (value: RichTextValue) => textOf(value ?? {}).replace(/\s+/g, " ").trim();

/**
 * Tina saves a root holding one empty paragraph when the editor is cleared, and keeps a blank
 * paragraph at the end of a filled one, so empty means "draws nothing", not "has no nodes". It reads
 * `toBlocks`, so what the page and the copy keep and what counts as filled cannot disagree.
 */
export const isRichTextEmpty = (value: RichTextValue, shape?: Shape) => toBlocks(value, shape).length === 0;

/** Tina cannot read a value saved in another shape, such as a list of strings, and says so with a node of this type. */
export const isUnreadable = (value: RichTextValue) => kids(value).some((child) => child.type === "invalid_markdown");

const isInline = (node: RichNode) => typeof node.text === "string" || ["a", "break", "html_inline"].includes(node.type ?? "");

// Neighbouring text with the same look is one node, so the markup has no empty comment between the words.
const joinText = (nodes: RichNode[]): RichNode[] =>
  nodes.reduce<RichNode[]>((all, node) => {
    const last = all[all.length - 1];
    if (last?.type === "text" && node.type === "text" && !last.bold === !node.bold && !last.italic === !node.italic) {
      all[all.length - 1] = { ...last, text: `${last.text}${node.text}` };
    } else all.push(node);
    return all;
  }, []);

const inline = (node: RichNode): RichNode[] => {
  if (typeof node.text === "string") {
    if (!node.text) return [];
    return [{ type: "text", text: node.text, ...(node.bold ? { bold: true } : {}), ...(node.italic ? { italic: true } : {}) }];
  }
  if (node.type === "break") return [{ type: "break" }];
  // Typed angle brackets, such as <T>, parse as html; they are shown as the characters they were typed as.
  if (node.type === "html_inline" && typeof node.value === "string") return inline({ text: node.value });
  if (node.type === "a") {
    const url = safeUrl(node.url);
    const children = inlines(kids(node));
    return url ? [{ type: "a", url, children }] : children;
  }
  // An unknown inline keeps its words and loses its look.
  return inlines(kids(node));
};

const inlines = (nodes: RichNode[] = []): RichNode[] => joinText(nodes.flatMap(inline));

const codeLines = (node: RichNode): RichNode[] => {
  const rows: RichNode[][] = typeof node.value === "string" ? node.value.split("\n").map((line) => [{ text: line }]) : kids(node).map((row) => kids(row));
  return rows.flatMap((row, index) => [...(index ? [{ type: "break" }] : []), ...inlines(row)]);
};

const paragraph = (children: RichNode[], heading = false): RichNode[] =>
  plainText({ children }) ? [{ type: "p", children, ...(heading ? { heading } : {}) }] : [];

/** What a field may keep beyond paragraphs and lists. The Figures body keeps both. */
export type Shape = {
  /** Pictures from this site or the web, each as an `img` block. */
  images?: boolean;
  /** A heading of any level, as an `h3` block that the page draws in the template's h3 style. */
  headings?: boolean;
};

const picture = (node: RichNode): RichNode[] => {
  const url = safeImageUrl(node.url);
  return url ? [{ type: "img", url, alt: node.alt?.trim() ?? "", caption: typeof node.caption === "string" ? node.caption.trim() : "" }] : [];
};

// Tina keeps a picture inside the paragraph it was typed in, so a paragraph is cut at each picture:
// the words before it, the picture, the words after.
const cutAtPictures = (node: RichNode): RichNode[] => {
  const blocks: RichNode[] = [];
  let run: RichNode[] = [];
  const flush = () => {
    blocks.push(...paragraph(inlines(run)));
    run = [];
  };
  kids(node).forEach((child) => {
    if (child.type === "img") {
      flush();
      blocks.push(...picture(child));
    } else run.push(child);
  });
  flush();
  return blocks;
};

const list = (node: RichNode): RichNode[] => {
  const items = kids(node).flatMap(item);
  return items.length ? [{ type: node.type, children: items }] : [];
};

// A list item holds its own words in `lic` and any nested list after them.
const item = (node: RichNode): RichNode[] => {
  const children: RichNode[] = [];
  let run: RichNode[] = [];
  const flush = () => {
    if (run.length) children.push({ type: "lic", children: inlines(run) });
    run = [];
  };
  kids(node).forEach((child) => {
    if (isInline(child)) run.push(child);
    else {
      flush();
      if (LISTS.has(child.type ?? "")) children.push(...list(child));
      else children.push({ type: "lic", children: inlines(kids(child)) });
    }
  });
  flush();
  return plainText({ children }) ? [{ type: "li", children }] : [];
};

const block = (node: RichNode, shape: Shape = {}): RichNode[] => {
  const type = node.type ?? "";
  if (LISTS.has(type)) return list(node);
  if (type === "p" || type === "lic") return shape.images ? cutAtPictures(node) : paragraph(inlines(kids(node)));
  if (type === "img") return shape.images ? picture(node) : [];
  if (HEADINGS.has(type)) {
    const children = inlines(kids(node));
    return shape.headings ? (plainText({ children }) ? [{ type: "h3", children }] : []) : paragraph(children, true);
  }
  if (type === "code_block") return paragraph(codeLines(node));
  if (type === "html" && typeof node.value === "string") return paragraph(inlines([{ text: node.value }]));
  if (type === "blockquote") {
    const children = kids(node);
    return children.some(isInline) ? paragraph(inlines(children)) : children.flatMap((child) => block(child));
  }
  // A rule, table, embed or unparsed markdown has no place in the email.
  return isInline(node) ? paragraph(inlines([node])) : [];
};

/** Turns `web#42` in plain text into a link to that issue. Words already inside a link are left alone. */
const linkRefs = (nodes: RichNode[], owner?: string | null): RichNode[] =>
  nodes.flatMap((node) => {
    if (node.type === "text" && node.text) {
      const look = { ...(node.bold ? { bold: true } : {}), ...(node.italic ? { italic: true } : {}) };
      const parts: RichNode[] = [];
      let cursor = 0;
      for (const match of node.text.matchAll(ISSUE_REF)) {
        const [ref, refOwner = owner, repo, number] = match;
        if (!refOwner) continue;
        const start = match.index ?? 0;
        if (start > cursor) parts.push({ type: "text", text: node.text.slice(cursor, start), ...look });
        parts.push({ type: "a", url: issueUrl(refOwner, repo, number), children: [{ type: "text", text: ref, ...look }] });
        cursor = start + ref.length;
      }
      if (!parts.length) return [node];
      if (cursor < node.text.length) parts.push({ type: "text", text: node.text.slice(cursor), ...look });
      return parts;
    }
    if (node.type === "a" || !Array.isArray(node.children)) return [node];
    return [{ ...node, children: linkRefs(node.children, owner) }];
  });

const spaceList = (node: RichNode, gap: number): RichNode => ({
  ...node,
  children: kids(node).map((li, index, items) => ({
    ...li,
    gapAfter: index === items.length - 1 ? 0 : gap,
    children: kids(li).map((child) => (LISTS.has(child.type ?? "") ? { ...spaceList(child, gap), gapAfter: 0 } : child)),
  })),
});

type Options = {
  /** Space between blocks. */
  gap?: number;
  /** Space between the items of a list. */
  itemGap?: number;
  /** Space above the first block. */
  before?: number;
  /** Space below the last block. */
  after?: number;
  /** Put `Figure:` or `Table:` in front unless the text already starts that way. */
  prefix?: "Figure" | "Table";
  /** A link added after the last block, as ` - label`. */
  source?: { label?: string | null; url?: string | null };
  /** Links `web#42` to `githubOwner`'s issues, and `acme/web#42` to its own owner's. */
  linkIssues?: boolean;
  githubOwner?: string | null;
} & Shape;

/**
 * The blocks to draw: paragraphs and lists (and pictures and headings where `Shape` asks for them), blanks
 * dropped, each carrying the space around it so the renderer needs no stylesheet and no `:first-child`.
 */
export function toBlocks(
  value: RichTextValue,
  { gap = 6, itemGap = 6, before = 0, after = 0, prefix, source, linkIssues, githubOwner, images, headings }: Options = {}
): RichNode[] {
  const flat = kids(value).flatMap((child) => block(child, { images, headings }));
  const blocks = linkIssues ? linkRefs(flat, githubOwner) : flat;
  if (blocks.length && prefix && !PREFIXED.test(plainText({ children: blocks }))) {
    if (blocks[0].type === "p") blocks[0] = { ...blocks[0], children: joinText([{ type: "text", text: `${prefix}: ` }, ...kids(blocks[0])]) };
    else blocks.unshift({ type: "p", children: [{ type: "text", text: `${prefix}:` }] });
  }
  if (source?.label?.trim()) {
    const link: RichNode = { type: "a", url: safeUrl(source.url), children: [{ type: "text", text: source.label }] };
    const last = blocks[blocks.length - 1];
    if (last?.type === "p") blocks[blocks.length - 1] = { ...last, children: joinText([...kids(last), { type: "text", text: " - " }, link]) };
    else blocks.push({ type: "p", children: [link] });
  }
  return blocks.map((node, index) => ({
    ...(LISTS.has(node.type ?? "") ? spaceList(node, itemGap) : node),
    gapAfter: index === blocks.length - 1 ? after : gap,
    ...(index === 0 && before ? { gapBefore: before } : {}),
  }));
}
