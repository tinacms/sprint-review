import type { Template } from "tinacms";
import { figureFields, figuresBody, placeholder, richText } from "./fields";

// The TinaCMS & TinaCloud review's own section types, on top of the starter's.
export const customSectionTemplates: Template[] = [
  {
    name: "hours",
    label: "Hours worked",
    ui: { defaultItem: { heading: "Hours worked" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "Teams",
        list: true,
        fields: [
          { type: "string", name: "team", label: "Team" },
          { type: "number", name: "hours", label: "Hours" },
          { type: "number", name: "previousHours", label: "Hours last Sprint" },
          figuresBody(),
          // The figure as saved before the body, so older Sprints still draw.
          ...figureFields,
        ],
        ui: { itemProps: (item) => ({ label: item?.team }) },
      },
    ],
  },
  {
    name: "teamAiTools",
    label: "AI Tools",
    ui: { defaultItem: { heading: "AI Tools", subsection: true } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "People",
        list: true,
        fields: [
          { type: "string", name: "person", label: "Person" },
          richText(["bold", "italic", "link", "ul", "ol"], { name: "tools", label: "Tools" }),
          { type: "string", name: "limits", label: "Limit Utilization" },
        ],
        ui: { itemProps: (item) => ({ label: item?.person }) },
      },
    ],
  },
  {
    name: "adrs",
    label: "ADR changes",
    ui: { defaultItem: { heading: "ADR Changes", placeholder: "No ADR changes this Sprint" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "ADRs",
        list: true,
        fields: [
          { type: "string", name: "title", label: "ADR" },
          { type: "string", name: "url", label: "Link" },
          { type: "string", name: "change", label: "Change", options: ["New", "Updated", "Superseded", "Retired"] },
          { type: "string", name: "summary", label: "Summary", ui: { component: "textarea" } },
          { type: "string", name: "pr", label: "PR", description: "For example tinacloud#4100" },
        ],
        ui: { itemProps: (item) => ({ label: item?.title }) },
      },
      placeholder("Shown while there are no ADR changes"),
    ],
  },
];
