import type { Template } from "tinacms";
import { figureFields } from "./fields";

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
          ...figureFields,
        ],
        ui: { itemProps: (item) => ({ label: item?.team }) },
      },
    ],
  },
  {
    name: "aiTools",
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
          { type: "string", name: "tools", label: "Tools" },
          { type: "string", name: "limits", label: "Limits" },
          { type: "string", name: "expiry", label: "Expiry", description: "When the limit resets, for example Fri 9 Oct" },
        ],
        ui: { itemProps: (item) => ({ label: item?.person }) },
      },
    ],
  },
];
