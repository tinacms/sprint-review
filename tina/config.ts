import { defineConfig, type Collection } from "tinacms";
import { meetingSync } from "../lib/meeting";
import settings from "./collections/settings";
import sprintForecast from "./collections/sprintForecast";
import sprintReview from "./collections/sprintReview";

// Review N and forecast N+1 are one meeting, so a save on either copies the meeting fields to the other.
const withMeetingSync = (collection: Collection, from: "review" | "forecast"): Collection => ({
  ...collection,
  ui: { ...collection.ui, beforeSubmit: meetingSync(from) },
});

export default defineConfig({
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  branch:
    process.env.NEXT_PUBLIC_TINA_BRANCH ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
    process.env.HEAD,
  token: process.env.TINA_TOKEN,
  media: {
    tina: {
      publicFolder: "public",
      mediaRoot: "uploads",
    },
  },
  build: {
    publicFolder: "public",
    outputFolder: "admin",
  },
  schema: {
    collections: [withMeetingSync(sprintReview, "review"), withMeetingSync(sprintForecast, "forecast"), settings],
  },
});
