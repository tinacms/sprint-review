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

export const figureFields: TinaField[] = [
  { type: "image", name: "image", label: "Figure" },
  { type: "string", name: "caption", label: "Caption", ui: textarea },
  { type: "string", name: "sourceLabel", label: "Source" },
  { type: "string", name: "sourceUrl", label: "Source link" },
  placeholder("Shown in the empty frame until the image is added"),
];

export const sectionLabel = (item: { heading?: string }) => ({ label: item?.heading });
