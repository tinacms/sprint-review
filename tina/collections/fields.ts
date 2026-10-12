import type { TinaField } from "tinacms";

export const textarea = { component: "textarea" } as const;

export const heading: TinaField = { type: "string", name: "heading", label: "Heading" };

export const subsection: TinaField = {
  type: "boolean",
  name: "subsection",
  label: "Part of the section above",
  description: "A smaller heading and a smaller gap, so it reads as part of the previous section",
};

export const placeholder = (description: string): TinaField => ({
  type: "string",
  name: "placeholder",
  label: "Placeholder",
  description,
});

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type RichTextTool = "bold" | "italic" | "link" | "ul" | "ol" | "image" | "heading";

// NOTE: [12 Oct 2026] EK - Only what the email carries is offered. No heading levels also switches off
// the "## " shortcut, and the floating toolbar only turns text into a heading, so it is off.
// A field that lists "heading" offers the levels in `headings`, and the page draws every level as the template's h3.
export const richText = (
  tools: RichTextTool[],
  field: { name: string; label: string; description?: string },
  headings: HeadingLevel[] = []
): TinaField => ({
  type: "rich-text",
  ...field,
  parser: { type: "markdown" },
  overrides: { toolbar: tools, headingLevels: headings, showFloatingToolbar: false },
});

/** A caption is bold in the email already, so bold is not offered. */
export const captionField = (description = "The email adds the Figure: prefix"): TinaField =>
  richText(["italic", "link", "ul", "ol"], { name: "caption", label: "Caption", description });

/**
 * The body of a Figures section: pictures from the media manager, a small heading above each for its
 * title, and the paragraph straight under a picture as its caption.
 */
export const figuresBody = (): TinaField =>
  richText(
    ["heading", "image", "bold", "italic", "link", "ul", "ol"],
    {
      name: "body",
      label: "Figures",
      description:
        "Add a screenshot with the image button. A heading above it is its title, and the paragraph straight under it is its caption (the email adds Figure:). Text and lists can go anywhere",
    },
    ["h3"]
  );

/** A figure as the section stored it before the body. Kept so older files still open and draw. */
export const figureFields: TinaField[] = [
  { type: "image", name: "image", label: "Figure" },
  { type: "string", name: "title", label: "Title", description: "A small heading above the figure, for example Claude Stats" },
  captionField(),
  { type: "string", name: "sourceLabel", label: "Source" },
  { type: "string", name: "sourceUrl", label: "Source link" },
  placeholder("Shown in the empty frame until the image is added"),
];

export const sectionLabel = (item: { heading?: string }) => ({ label: item?.heading });
