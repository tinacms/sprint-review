import type { Collection } from "tinacms";
import { richText } from "./fields";
import { GOAL_STATUSES, sectionsField, sprintFields, sprintFilename } from "./shared";

const retroField = (name: string, label: string) => richText(["bold", "italic", "link", "ul", "ol"], { name, label });

const sprintReview: Collection = {
  label: "Sprint Reviews",
  name: "sprintReview",
  path: "content/sprint-review",
  format: "json",
  defaultItem: () => ({
    workingDays: 5,
    sections: [
      { _template: "figures", heading: "Internal Hours", placeholder: "Paste screenshot of Internal Hours in the editor" },
      { _template: "backlog", heading: "Sprint Backlog" },
      { _template: "velocity", heading: "Recent Velocity" },
      { _template: "list", heading: "R&D" },
      { _template: "aiTools", heading: "AI Tool Usage" },
      { _template: "figures", heading: "AI Stats", placeholder: "Paste the Claude Stats and Copilot Stats screenshots in the editor" },
      {
        _template: "cards",
        heading: "Overall Project Snapshot",
        items: [{ label: "Open Items" }, { label: "Committed (next Sprint)" }, { label: "Avg Velocity" }, { label: "Backlog Ready" }],
      },
    ],
  }),
  fields: [
    ...sprintFields,
    {
      type: "object",
      name: "goals",
      label: "Sprint Goals",
      list: true,
      fields: [
        { type: "string", name: "status", label: "Outcome", options: GOAL_STATUSES },
        { type: "string", name: "title", label: "Title", description: "Shown in bold before the goal" },
        { type: "string", name: "text", label: "Goal", ui: { component: "textarea" } },
        { type: "string", name: "fromCall", label: "From the call", description: "A yellow FROM CALL note under the goal", ui: { component: "textarea" } },
      ],
      ui: { itemProps: (item) => ({ label: item?.title || item?.text }) },
    },
    sectionsField({ kind: "review" }),
    {
      type: "object",
      name: "retro",
      label: "Sprint Retrospective",
      fields: [
        retroField("wentWell", "✅ What went well"),
        retroField("didntGoWell", "❌ What didn't go so well"),
        retroField("improvements", "💡 Improvements for next Sprint"),
      ],
    },
  ],
  ui: {
    filename: sprintFilename,
    router: ({ document }) => `/review/${document._sys.filename}`,
  },
};

export default sprintReview;
