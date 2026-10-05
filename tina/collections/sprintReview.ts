import type { Collection } from "tinacms";
import { GOAL_STATUSES, sectionsField, sprintFields, sprintFilename } from "./shared";

const sprintReview: Collection = {
  label: "Sprint Reviews",
  name: "sprintReview",
  path: "content/sprint-review",
  format: "json",
  defaultItem: () => ({
    durationLabel: "2 weeks",
    sections: [
      { _template: "backlog", heading: "Sprint Backlog" },
      { _template: "figures", heading: "Sprint Burnup", items: [{}] },
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
        { type: "string", name: "status", label: "Status", options: GOAL_STATUSES },
        { type: "string", name: "text", label: "Goal", ui: { component: "textarea" } },
      ],
      ui: { itemProps: (item) => ({ label: item?.text }) },
    },
    sectionsField({ bonus: true }),
    {
      type: "object",
      name: "retro",
      label: "Sprint Retrospective",
      fields: [
        { type: "string", name: "wentWell", label: "✅ What went well", list: true },
        { type: "string", name: "didntGoWell", label: "❌ What didn't go so well", list: true },
        { type: "string", name: "improvements", label: "💡 Improvements for next Sprint", list: true },
      ],
    },
  ],
  ui: {
    filename: sprintFilename,
    router: ({ document }) => `/review/${document._sys.filename}`,
  },
};

export default sprintReview;
