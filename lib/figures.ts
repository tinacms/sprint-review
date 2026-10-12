import { isRichTextEmpty, plainText, toBlocks, type RichNode, type RichTextValue, type Shape } from "./rich-text";

/** The Figures body keeps pictures and headings besides the paragraphs and lists every field keeps. */
export const FIGURE_SHAPE: Shape = { images: true, headings: true };

export const isFigureBodyEmpty = (value: RichTextValue) => isRichTextEmpty(value, FIGURE_SHAPE);

// NOTE: [12 Oct 2026] EK - The prepare-sprint-review skill writes bodies in this shape (a heading, the picture, the caption
// paragraph) into Sprint files, so a change to how a body is cut into parts needs the same change in that writer.
// See https://github.com/SSWConsulting/SSW.AISkills/blob/main/plugins/ssw-scrum/skills/prepare-sprint-review/scripts/tina-site.mjs
/**
 * One piece of the Figures body, drawn as one block. A heading belongs to what follows it: a picture
 * (a figure's title) or a run of paragraphs and lists. A heading with nothing after it stands alone.
 */
export type FigurePart = {
  title?: string;
  /** The paragraph straight under the picture is its caption. */
  picture?: { url: string; alt: string; caption?: RichNode };
  /** Paragraphs and lists that are not a caption. */
  blocks?: RichNode[];
};

export function figureParts(value: RichTextValue): FigurePart[] {
  const parts: FigurePart[] = [];
  const blocks = toBlocks(value, FIGURE_SHAPE);
  let title: string | undefined;
  const add = (part: FigurePart) => {
    parts.push(title ? { title, ...part } : part);
    title = undefined;
  };
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.type === "h3") {
      if (title) add({});
      title = plainText(block);
    } else if (block.type === "img") {
      const next = blocks[index + 1];
      // The Caption box of Tina's image form stands in when no paragraph follows.
      const boxed: RichNode | undefined = block.caption ? { type: "p", children: [{ type: "text", text: block.caption }] } : undefined;
      const caption = next?.type === "p" ? next : boxed;
      if (next?.type === "p") index += 1;
      add({ picture: { url: block.url!, alt: block.alt ?? "", caption } });
    } else {
      const last = parts[parts.length - 1];
      if (!title && last?.blocks) last.blocks.push(block);
      else add({ blocks: [block] });
    }
  }
  if (title) add({});
  return parts;
}
