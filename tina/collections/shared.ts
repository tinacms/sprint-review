import type { Template, TinaField } from "tinacms";
import { plainText } from "../../lib/rich-text";
import { customSectionTemplates } from "./custom-sections";
import { captionField, figureFields, figuresBody, heading, placeholder, richText, sectionLabel, subsection, textarea } from "./fields";

export const STATUSES = [
  { value: "done", label: "Done" },
  { value: "pendingRelease", label: "Pending Release" },
  { value: "inReview", label: "In Review" },
  { value: "inProgress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "ready", label: "Ready" },
  { value: "backlog", label: "Backlog" },
  { value: "needsTriage", label: "Needs Triage" },
  { value: "wontDo", label: "Won't Do" },
];

// What a Sprint goal ended as. Blank reads as suggested.
export const GOAL_STATUSES = [
  { value: "suggested", label: "Suggested" },
  { value: "done", label: "Done" },
  { value: "partial", label: "Partial" },
  { value: "missed", label: "Missed" },
];

export const LIMITS = [
  { value: "never", label: "✅ Never" },
  { value: "sometimes", label: "⚠️ Sometimes" },
  { value: "often", label: "❌ Often" },
];

export const ORIGINS = [
  { value: "carryOver", label: "Carry over" },
  { value: "new", label: "New" },
];

const backlogTemplate = ({ kind }: { kind: "review" | "forecast" }): Template => ({
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
        {
          type: "string",
          name: "id",
          label: "ID",
          description: "Shown in the ID column. Left blank, it is read from the link",
        },
        { type: "string", name: "assignees", label: "Assignee" },
        { type: "number", name: "estimate", label: "Effort (points)" },
        { type: "string", name: "status", label: "Status", options: STATUSES },
        ...(kind === "review"
          ? ([
              { type: "boolean", name: "bonus", label: "Bonus (pulled in mid-Sprint)" },
              { type: "number", name: "movedTo", label: "Moved to Sprint" },
            ] as TinaField[])
          : ([{ type: "string", name: "origin", label: "Carry over or new", options: ORIGINS }] as TinaField[])),
        { type: "boolean", name: "bold", label: "Bold (worth mentioning in the meeting)" },
      ],
      ui: { itemProps: (item) => ({ label: item?.title }) },
    },
    {
      type: "string",
      name: "netChange",
      label: "Net change",
      description: "For example: +6 (backlog growing: 29 created, 23 closed)",
    },
    ...(kind === "forecast"
      ? ([
          {
            type: "string",
            name: "fromCall",
            label: "From the call",
            description: "A yellow FROM CALL note under the table",
            ui: textarea,
          },
        ] as TinaField[])
      : []),
    { type: "string", name: "note", label: "Note", ui: textarea },
  ],
});

const sharedTemplates: Template[] = [
  {
    name: "figures",
    label: "Figures (burnup, dashboards, screenshots)",
    ui: { defaultItem: { heading: "Sprint Burnup" } },
    fields: [
      figuresBody(),
      placeholder("Shown in the empty frame until the figures are added"),
      {
        type: "object",
        name: "items",
        label: "Figures (old)",
        description: "Shown only while Figures above is blank. Run node scripts/migrate-rich-text.mjs to move these into it",
        list: true,
        fields: figureFields,
        ui: { itemProps: (item) => ({ label: item?.title || plainText(item?.caption) || item?.placeholder }) },
      },
    ],
  },
  {
    name: "velocity",
    label: "Recent Velocity",
    ui: { defaultItem: { heading: "Recent Velocity" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "Sprints (newest first)",
        list: true,
        fields: [
          { type: "number", name: "sprint", label: "Sprint" },
          { type: "number", name: "committed", label: "Originally committed (points)" },
          { type: "number", name: "delivered", label: "Delivered (points)" },
          { type: "number", name: "workingDays", label: "Working days" },
          { type: "string", name: "workingNote", label: "Working days note", description: "For example: Easter" },
          { type: "boolean", name: "isCurrent", label: "Current Sprint (highlighted row)" },
        ],
        ui: { itemProps: (item) => ({ label: item?.sprint != null ? `Sprint ${item.sprint}` : "Sprint" }) },
      },
      {
        type: "number",
        name: "averageVelocity",
        label: "Average velocity (points per Sprint)",
        description: "Left blank, it is worked out from the past Sprints",
      },
      {
        type: "number",
        name: "pointsPerDay",
        label: "Points per working day",
        description: "Left blank, it is worked out from the past Sprints",
      },
    ],
  },
  {
    name: "aiTools",
    label: "AI Tool Usage",
    ui: { defaultItem: { heading: "AI Tool Usage" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "Team members",
        list: true,
        fields: [
          { type: "string", name: "member", label: "Team member" },
          richText(["bold", "italic", "link", "ul", "ol"], { name: "tools", label: "AI tools" }),
          {
            type: "number",
            name: "planUsed",
            label: "Plan used (%)",
            description: "The percent of their AI plan used this Sprint, 0 to 100. Green from 75, yellow from 50, red below",
            ui: { validate: (value) => (value != null && (value < 0 || value > 100) ? "Enter a percent from 0 to 100" : undefined) },
          },
          {
            type: "string",
            name: "limits",
            label: "Hitting limits (old)",
            description: "Shown only while Plan used is blank",
            options: LIMITS,
          },
        ],
        ui: { itemProps: (item) => ({ label: item?.member }) },
      },
      captionField("What the table shows. The email adds the Table: prefix"),
    ],
  },
  {
    name: "cards",
    label: "Cards (project snapshot numbers)",
    ui: { defaultItem: { heading: "Overall Project Snapshot" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "Cards",
        list: true,
        fields: [
          { type: "string", name: "value", label: "Number" },
          { type: "string", name: "label", label: "Label" },
        ],
        ui: { itemProps: (item) => ({ label: item?.label }) },
      },
    ],
  },
  {
    name: "team",
    label: "The Team (cards with availability)",
    ui: { defaultItem: { heading: "The Team" } },
    fields: [
      {
        type: "object",
        name: "items",
        label: "Team members",
        list: true,
        fields: [
          { type: "string", name: "name", label: "Name" },
          { type: "string", name: "handle", label: "GitHub handle", description: "Without the @" },
          {
            type: "image",
            name: "avatar",
            label: "Avatar",
            description: "Left blank, the GitHub picture for the handle is used",
          },
          { type: "string", name: "availability", label: "Availability", description: "For example: 4 days" },
          { type: "boolean", name: "unavailable", label: "Unavailable this Sprint" },
          { type: "string", name: "reason", label: "Reason", description: "For example: Annual leave" },
        ],
        ui: { itemProps: (item) => ({ label: item?.name }) },
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
    ui: { itemProps: (item) => ({ label: item?.heading || plainText(item?.body) }) },
    fields: [
      richText(["bold", "italic", "link", "ul", "ol"], {
        name: "body",
        label: "Text",
        description: "Write an issue as web#42 and it links",
      }),
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

/** The sections a team adds, removes and reorders between the Sprint Details and the Retrospective. */
export const sectionsField = ({ kind }: { kind: "review" | "forecast" }): TinaField => ({
  type: "object",
  name: "sections",
  label: "Sections",
  list: true,
  templates: [backlogTemplate({ kind }), ...sharedTemplates, ...customSectionTemplates].map(withCommonFields),
});

// Fields every sprint document carries, in the order the editor shows them.
export const sprintFields: TinaField[] = [
  { type: "number", name: "number", label: "Sprint number", required: true },
  { type: "datetime", name: "startDate", label: "Sprint start" },
  {
    type: "datetime",
    name: "endDate",
    label: "Sprint end",
    description: "The last day of the Sprint, so a Sprint of 15 to 21 September ends on the 21st",
  },
  { type: "number", name: "workingDays", label: "Working days", description: "Shown in Sprint Details beside the calendar days" },
  { type: "string", name: "publicHolidays", label: "Public holidays", list: true, description: "For example: Mon 5 Oct (Labour Day)" },
  {
    type: "string",
    name: "durationLabel",
    label: "Duration note (used when working days are blank)",
    description: "For example: 1 week",
  },
  { type: "string", name: "productOwner", label: "Product Owner" },
  { type: "string", name: "recordingUrl", label: "Meeting recording" },
  { type: "number", name: "recordingMinutes", label: "Recording length (minutes)" },
  { type: "string", name: "attendees", label: "Attendees", list: true },
  {
    type: "object",
    name: "references",
    label: "More references",
    description: "Added to the References list after the SSW rule and the Project Portal",
    list: true,
    fields: [
      { type: "string", name: "label", label: "Label" },
      { type: "string", name: "url", label: "Link" },
    ],
    ui: { itemProps: (item) => ({ label: item?.label }) },
  },
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
