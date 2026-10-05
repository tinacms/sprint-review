import type { Collection } from "tinacms";

const settings: Collection = {
  label: "Settings",
  name: "settings",
  path: "content/settings",
  format: "json",
  ui: {
    allowedActions: { create: false, delete: false },
  },
  fields: [
    { type: "string", name: "teamName", label: "Team name", required: true },
    {
      type: "image",
      name: "logo",
      label: "Logo",
      description: "Shown in place of the team name. An SVG needs width and height attributes.",
    },
    { type: "number", name: "logoWidth", label: "Logo width (px)" },
    { type: "string", name: "boardHeading", label: "Board heading", description: "Defaults to Board" },
    { type: "string", name: "boardLabel", label: "Board link text", description: "For example: Sprint board" },
    { type: "string", name: "boardUrl", label: "Board link" },
    { type: "string", name: "recordingHeading", label: "Recording heading", description: "Defaults to Recording" },
    {
      type: "string",
      name: "githubOwner",
      label: "GitHub owner",
      description: 'Links "web#42" in goals and lists to github.com/<owner>/web/issues/42',
    },
    {
      type: "string",
      name: "signature",
      label: "Email signature",
      description: "Added below the copied email only. Plain text, one line per line, or HTML pasted from your mail client",
      ui: { component: "textarea" },
    },
  ],
};

export default settings;
