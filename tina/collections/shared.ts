import type { Template, TinaField } from "tinacms";
import { customSectionTemplates } from "./custom-sections";
import { figureFields, heading, placeholder, sectionLabel, subsection, textarea } from "./fields";

export const STATUSES = [
  { value: "done", label: "✅ Done" },
  { value: "inReview", label: "👀 In review" },
  { value: "inProgress", label: "🏗 In progress" },
  { value: "backlog", label: "📋 Backlog - Not Ready" },
  { value: "wontDo", label: "❌ Won't do" },
];

// A goal can also be missed outright, which no backlog item ever is.
export const GOAL_STATUSES = [...STATUSES, { value: "missed", label: "❌ Missed" }];

const backlogTemplate = ({ bonus }: { bonus: boolean }): Template => ({
  name: "backlog",
  label: "Backlog",
  ui: { defaultItem: { heading: "Sprint Backlog" } },
  fields: [
    {
      type: "object",
      name: "items",
      label: "Items",
      list: true,
      fields: [
        { type: "string", name: "title", label: "Title" },
        { type: "string", name: "url", label: "Link" },
        { type: "string", name: "assignees", label: "Assignees" },
        { type: "number", name: "estimate", label: "Estimate" },
        { type: "string", name: "status", label: "Status", options: STATUSES },
        ...(bonus ? [{ type: "boolean", name: "bonus", label: "Bonus (pulled in mid-Sprint)" } as TinaField] : []),
        { type: "boolean", name: "bold", label: "Bold (worth mentioning in the meeting)" },
      ],
      ui: { itemProps: (item) => ({ label: item?.title }) },
    },
    { type: "string", name: "note", label: "Note", ui: textarea },
  ],
});

const sharedTemplates: Template[] = [
  {
    name: "figures",
    label: "Figures (burnup, dashboards, screenshots)",
    ui: { defaultItem: { heading: "Sprint Burnup" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "Figures",
        list: true,
        fields: figureFields,
        ui: { itemProps: (item) => ({ label: item?.caption || item?.placeholder }) },
      },
    ],
  },
  {
    name: "deployments",
    label: "Deployments",
    ui: { defaultItem: { heading: "Production Deployments" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "Products",
        list: true,
        fields: [
          { type: "string", name: "product", label: "Product" },
          { type: "number", name: "count", label: "Releases" },
          { type: "string", name: "versions", label: "Versions" },
        ],
        ui: { itemProps: (item) => ({ label: item?.product }) },
      },
    ],
  },
  {
    name: "metrics",
    label: "Metrics (last Sprint vs this Sprint)",
    ui: { defaultItem: { heading: "Metrics" } },
    fields: [
      { type: "string", name: "labelHeading", label: "First column heading", description: "Defaults to Metric" },
      {
        type: "object",
        name: "items",
        label: "Metrics",
        list: true,
        fields: [
          { type: "string", name: "label", label: "Metric" },
          { type: "string", name: "url", label: "Source link" },
          { type: "number", name: "previous", label: "Last Sprint" },
          { type: "number", name: "current", label: "This Sprint" },
          { type: "boolean", name: "lowerIsBetter", label: "Lower is better (errors, bugs)" },
        ],
        ui: { itemProps: (item) => ({ label: item?.label }) },
      },
      { type: "string", name: "note", label: "Note", ui: textarea },
    ],
  },
  {
    name: "progress",
    label: "Progress (epics, milestones)",
    ui: { defaultItem: { heading: "Epics - Progress" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "Items",
        list: true,
        fields: [
          { type: "string", name: "name", label: "Name" },
          { type: "string", name: "url", label: "Link" },
          { type: "string", name: "group", label: "Group" },
          { type: "number", name: "done", label: "Closed" },
          { type: "number", name: "total", label: "Total" },
          {
            type: "number",
            name: "previousPercent",
            label: "Percent complete last Sprint",
            description: "The change column shows the difference, e.g. +17%",
          },
        ],
        ui: { itemProps: (item) => ({ label: item?.name }) },
      },
      { type: "string", name: "sourceLabel", label: "Source" },
      { type: "string", name: "sourceUrl", label: "Source link" },
    ],
  },
  {
    name: "list",
    label: "List (highlights, R&D, risks)",
    ui: { defaultItem: { heading: "Highlights" } },
    fields: [
      // Not "items": GraphQL rejects one name returning a string list here and objects elsewhere.
      { type: "string", name: "entries", label: "Items", list: true },
      placeholder("Shown while the list is empty"),
    ],
  },
  {
    name: "text",
    label: "Text",
    ui: { itemProps: (item) => ({ label: item?.heading || item?.body }) },
    fields: [
      {
        type: "string",
        name: "body",
        label: "Text",
        description: "A blank line starts a new paragraph. Write a link as [text](https://...)",
        ui: textarea,
      },
      { type: "boolean", name: "small", label: "Small print" },
      placeholder("Shown while the text is empty"),
    ],
  },
];

// Every section, custom ones included, gets a heading and the subsection switch, so the page can
// treat them all alike.
const withCommonFields = (template: Template): Template => ({
  ...template,
  ui: { itemProps: sectionLabel, ...template.ui },
  fields: [heading, subsection, ...template.fields],
});

/** The sections a team adds, removes and reorders between the goals and the end of the page. */
export const sectionsField = ({ bonus }: { bonus: boolean }): TinaField => ({
  type: "object",
  name: "sections",
  label: "Sections",
  list: true,
  templates: [backlogTemplate({ bonus }), ...sharedTemplates, ...customSectionTemplates].map(withCommonFields),
});

// Fields every sprint document carries, in the order the editor shows them.
export const sprintFields: TinaField[] = [
  { type: "number", name: "number", label: "Sprint number", required: true },
  { type: "datetime", name: "startDate", label: "Sprint start" },
  { type: "datetime", name: "endDate", label: "Sprint end" },
  { type: "string", name: "durationLabel", label: "Duration", description: "For example: 2 weeks" },
  { type: "string", name: "productOwner", label: "Product Owner" },
  { type: "string", name: "recordingUrl", label: "Meeting recording" },
  { type: "number", name: "recordingMinutes", label: "Recording length (minutes)" },
  { type: "string", name: "attendees", label: "Attendees", list: true },
  {
    type: "object",
    name: "email",
    label: "Email header",
    fields: [
      { type: "string", name: "subject", label: "Subject", description: "Left blank, it is built from the team name and Sprint number" },
      { type: "string", name: "to", label: "To" },
      { type: "string", name: "cc", label: "Cc", description: "Separate addresses with semicolons" },
    ],
  },
];

// New documents are named sprint-<number>, which the review and forecast pages use to find each other.
export const sprintFilename = {
  readonly: true,
  slugify: (values: { number?: number }) => (values?.number != null ? `sprint-${values.number}` : ""),
};
