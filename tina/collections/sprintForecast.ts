import type { Collection } from "tinacms";
import { sectionsField, sprintFields, sprintFilename } from "./shared";

const sprintForecast: Collection = {
  label: "Sprint Forecasts",
  name: "sprintForecast",
  path: "content/sprint-forecast",
  format: "json",
  defaultItem: () => ({
    durationLabel: "2 weeks",
    sections: [{ _template: "backlog", heading: "Forecast Backlog" }],
  }),
  fields: [
    ...sprintFields,
    {
      type: "object",
      name: "goals",
      label: "Sprint Goals",
      list: true,
      fields: [{ type: "string", name: "text", label: "Goal", ui: { component: "textarea" } }],
      ui: { itemProps: (item) => ({ label: item?.text }) },
    },
    { type: "string", name: "scopeNote", label: "Scope note", ui: { component: "textarea" } },
    sectionsField({ bonus: false }),
  ],
  ui: {
    filename: sprintFilename,
    router: ({ document }) => `/forecast/${document._sys.filename}`,
  },
};

export default sprintForecast;
