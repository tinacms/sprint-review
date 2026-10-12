import type { Collection } from "tinacms";
import { GOAL_STATUSES, sectionsField, sprintFields, sprintFilename } from "./shared";

const sprintForecast: Collection = {
  label: "Sprint Forecasts",
  name: "sprintForecast",
  path: "content/sprint-forecast",
  format: "json",
  defaultItem: () => ({
    workingDays: 5,
    sections: [
      { _template: "team", heading: "The Team" },
      { _template: "backlog", heading: "Sprint Backlog" },
      { _template: "figures", heading: "AI Stats", placeholder: "Paste the Claude Stats and Copilot Stats screenshots in the editor" },
    ],
  }),
  fields: [
    ...sprintFields,
    { type: "string", name: "capacity", label: "Capacity", description: "For example: ~28 pts (4 working days x 7 pts/day avg, minus 10% buffer)" },
    { type: "datetime", name: "reviewDate", label: "Sprint Review date", description: "Left blank, the Sprint end date is shown" },
    {
      type: "object",
      name: "goals",
      label: "Sprint Goals",
      list: true,
      fields: [
        { type: "string", name: "status", label: "Outcome", description: "Left blank, it reads as suggested", options: GOAL_STATUSES },
        { type: "string", name: "title", label: "Title", description: "Shown in bold before the goal" },
        { type: "string", name: "text", label: "Goal", ui: { component: "textarea" } },
        { type: "string", name: "fromCall", label: "From the call", description: "A yellow FROM CALL note under the goal", ui: { component: "textarea" } },
      ],
      ui: { itemProps: (item) => ({ label: item?.title || item?.text }) },
    },
    {
      type: "string",
      name: "scopeNote",
      label: "Intro quote",
      description: "The quoted line under the greeting. Left blank, SSW's standard wording is used",
      ui: { component: "textarea" },
    },
    sectionsField({ kind: "forecast" }),
  ],
  ui: {
    filename: sprintFilename,
    router: ({ document }) => `/forecast/${document._sys.filename}`,
  },
};

export default sprintForecast;
